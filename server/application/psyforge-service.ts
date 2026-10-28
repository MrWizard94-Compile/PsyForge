import { createHash, randomUUID } from 'node:crypto';
import { computeFeatures } from '../domain/features.js';
import { buildBaselineModel } from '../domain/model.js';
import { assertModelResultEligibleForRecommendation } from '../domain/model-registry.js';
import {
  assertActor,
  assertTenant,
  parseConsentGrant,
  parseEvidenceSourceRegistration,
  parseTelemetryEvent,
} from '../domain/validation.js';
import { parseGraphAssertionRegistration } from '../domain/graph.js';
import {
  type Actor,
  type BaselineModelResult,
  type ConsentGrant,
  type EvidenceSource,
  type EvidenceSourceRegistration,
  type EvidenceSourceReview,
  type EvidenceSourceRevocation,
  type FeatureValue,
  GRAPH_SCHEMA_VERSION,
  type GraphAssertion,
  type GraphNode,
  type Recommendation,
  type ReviewDecision,
  type TelemetryEvent,
  DomainError,
} from '../domain/types.js';
import { PsyForgeRepository } from '../persistence/repository.js';

export interface Clock {
  now(): string;
}

export const systemClock: Clock = { now: () => new Date().toISOString() };

export class PsyForgeService {
  public constructor(private readonly repository: PsyForgeRepository, private readonly clock: Clock = systemClock) {}

  public grantConsent(actor: Actor, input: unknown): ConsentGrant {
    assertActor(actor, ['operator']);
    const grant = parseConsentGrant(input);
    assertTenant(actor, grant.tenantId);
    const now = this.clock.now();
    this.repository.transaction(() => this.repository.createConsent(grant, actor, now, randomUUID()));
    return grant;
  }

  public revokeConsent(actor: Actor, subjectId: string): boolean {
    assertActor(actor, ['operator']);
    return this.repository.transaction(() => {
      const occurredAt = this.clock.now();
      const revoked = this.repository.revokeConsent(actor.tenantId, subjectId, 'behavioral_analysis', actor, occurredAt, randomUUID());
      if (revoked) {
        this.repository.purgeSubjectOperationalData(actor.tenantId, subjectId, actor, occurredAt, randomUUID());
      }
      return revoked;
    });
  }

  public ingest(actor: Actor, input: unknown): { status: 'accepted' | 'duplicate'; event: TelemetryEvent } {
    assertActor(actor, ['ingestor']);
    let event: TelemetryEvent;
    try {
      event = parseTelemetryEvent(input);
    } catch (error) {
      const inputTenantId = typeof input === 'object' && input !== null && 'tenantId' in input && typeof (input as { tenantId?: unknown }).tenantId === 'string'
        ? (input as { tenantId: string }).tenantId
        : undefined;
      if (error instanceof DomainError && inputTenantId !== undefined) {
        this.repository.transaction(() => this.repository.appendRejectedEventAudit(inputTenantId, actor, 'unparsed', error.code, this.clock.now(), randomUUID()));
      }
      throw error;
    }
    assertTenant(actor, event.tenantId);
    const now = this.clock.now();
    return this.repository.transaction(() => {
      if (this.repository.eventExists(event.eventId)) {
        this.repository.appendDuplicateEventAudit(event.tenantId, actor, event.eventId, now, randomUUID());
        return { status: 'duplicate' as const, event };
      }
      if (!this.repository.hasActiveConsent(event.tenantId, event.subjectId, event.purpose, now)) {
        this.repository.appendRejectedEventAudit(event.tenantId, actor, event.eventId, 'CONSENT_DENIED', now, randomUUID());
        throw new DomainError('CONSENT_DENIED', 'No active consent grant permits this event.', 403);
      }
      this.repository.insertEvent({ ...event, receivedAt: now }, actor, randomUUID());
      return { status: 'accepted' as const, event };
    });
  }

  public recomputeFeatures(actor: Actor, subjectId: string, windowEnd = this.clock.now()): FeatureValue[] {
    assertActor(actor, ['operator']);
    const now = this.clock.now();
    return this.repository.transaction(() => {
      const features = computeFeatures(actor.tenantId, subjectId, this.repository.listEvents(actor.tenantId, subjectId), windowEnd, now);
      this.repository.replaceFeatures(features, actor, randomUUID());
      return features;
    });
  }

  public buildBaselineModel(actor: Actor, subjectId: string, windowEnd = this.clock.now()): BaselineModelResult {
    assertActor(actor, ['operator']);
    return this.repository.transaction(() => {
      const computedAt = this.clock.now();
      const features = computeFeatures(actor.tenantId, subjectId, this.repository.listEvents(actor.tenantId, subjectId), windowEnd, computedAt);
      this.repository.replaceFeatures(features, actor, randomUUID());
      const result = buildBaselineModel(features, computedAt);
      this.repository.saveModelResult(result, actor, randomUUID());
      return result;
    });
  }

  public createRecommendation(actor: Actor, modelResultId: string): Recommendation {
    assertActor(actor, ['operator']);
    return this.repository.transaction(() => {
      const model = this.repository.getModelResult(actor.tenantId, modelResultId);
      if (model === undefined) {
        throw new DomainError('NOT_FOUND', 'Model result was not found for this tenant.', 404);
      }
      assertModelResultEligibleForRecommendation(model);
      const createdAt = this.clock.now();
      const recommendation: Recommendation = {
        recommendationId: randomUUID(), tenantId: model.tenantId, subjectId: model.subjectId, modelResultId: model.modelResultId, createdAt, status: 'pending_review',
        summary: 'Review the descriptive engagement baseline with the product team before considering any non-deployment product-experience hypothesis.',
        uncertainty: 'Low confidence: this P0 baseline has no production calibration and must not be treated as a prediction or action authority.',
        ethicsScore: { manipulationRisk: 0, privacyRisk: 0, fairnessRisk: 0, confidence: 'low', disposition: 'review_required' },
      };
      this.repository.saveRecommendation(recommendation, actor, randomUUID());
      return recommendation;
    });
  }

  public decideRecommendation(actor: Actor, recommendationId: string, decision: ReviewDecision['decision'], rationale: string): Recommendation {
    if (decision === 'vetoed') {
      assertActor(actor, ['ethics_reviewer']);
    } else {
      assertActor(actor, ['reviewer']);
    }
    if (rationale.trim().length < 10 || rationale.length > 2_000) {
      throw new DomainError('VALIDATION_FAILED', 'Review rationale must contain 10–2000 characters.', 400);
    }
    return this.repository.transaction(() => {
      const recommendation = this.repository.getRecommendation(actor.tenantId, recommendationId);
      if (recommendation === undefined) {
        throw new DomainError('NOT_FOUND', 'Recommendation was not found for this tenant.', 404);
      }
      if (recommendation.status !== 'pending_review') {
        throw new DomainError('CONFLICT', 'Only a pending recommendation may receive a decision; terminal decisions are immutable.', 409);
      }
      const reviewDecision: ReviewDecision = { decisionId: randomUUID(), recommendationId, tenantId: actor.tenantId, reviewerId: actor.id, reviewerRole: actor.role as ReviewDecision['reviewerRole'], decision, rationale: rationale.trim(), occurredAt: this.clock.now() };
      this.repository.saveReviewDecision(reviewDecision, actor, randomUUID());
      return { ...recommendation, status: decision };
    });
  }

  public getRecommendation(actor: Actor, recommendationId: string): Recommendation {
    assertActor(actor, ['operator', 'reviewer', 'ethics_reviewer']);
    const recommendation = this.repository.getRecommendation(actor.tenantId, recommendationId);
    if (recommendation === undefined) {
      throw new DomainError('NOT_FOUND', 'Recommendation was not found for this tenant.', 404);
    }
    return recommendation;
  }

  /** Registers metadata and a content hash. The raw content is discarded before persistence. */
  public registerEvidenceSource(actor: Actor, input: unknown): EvidenceSource {
    assertActor(actor, ['operator']);
    let registration: EvidenceSourceRegistration;
    try {
      registration = parseEvidenceSourceRegistration(input);
      assertTenant(actor, registration.tenantId);
    } catch (error) {
      if (error instanceof DomainError) {
        this.repository.transaction(() => this.repository.appendRejectedEvidenceSourceAudit(actor.tenantId, actor, 'unparsed', 'unparsed', error.code, this.clock.now(), randomUUID()));
      }
      throw error;
    }
    const contentSha256 = createHash('sha256').update(registration.content, 'utf8').digest('hex');
    const contentBytes = Buffer.byteLength(registration.content, 'utf8');
    const existing = this.repository.getEvidenceSourceByNaturalKey(registration.tenantId, registration.sourceKey, registration.version);
    if (existing !== undefined) {
      const reason = existing.contentSha256 === contentSha256 ? 'DUPLICATE_VERSION' : 'EVIDENCE_HASH_MISMATCH';
      this.repository.transaction(() => this.repository.appendRejectedEvidenceSourceAudit(registration.tenantId, actor, registration.sourceKey, registration.version, reason, this.clock.now(), randomUUID()));
      if (reason === 'EVIDENCE_HASH_MISMATCH') {
        throw new DomainError('CONFLICT', 'Evidence content does not match the immutable hash registered for this tenant, source key, and version.', 409);
      }
      throw new DomainError('CONFLICT', 'An evidence source with this tenant, source key, and version already exists.', 409);
    }
    return this.repository.transaction(() => {
      const registeredAt = this.clock.now();
      const source: EvidenceSource = {
        sourceId: randomUUID(), tenantId: registration.tenantId, sourceKey: registration.sourceKey, version: registration.version,
        title: registration.title, stableCitation: registration.stableCitation, publisher: registration.publisher, publishedAt: registration.publishedAt,
        domain: registration.domain, licenseBasis: registration.licenseBasis, rightsReference: registration.rightsReference,
        contentSha256, contentBytes, status: 'pending_review', registeredAt,
      };
      this.repository.createEvidenceSource(source, actor, randomUUID());
      return source;
    });
  }

  public listEvidenceSources(actor: Actor): EvidenceSource[] {
    assertActor(actor, ['operator', 'evidence_reviewer']);
    return this.repository.listEvidenceSources(actor.tenantId);
  }

  public reviewEvidenceSource(actor: Actor, sourceId: string, decision: EvidenceSourceReview['decision'], rationale: string): EvidenceSource {
    assertActor(actor, ['evidence_reviewer']);
    if (!/^[0-9a-f-]{36}$/i.test(sourceId)) {
      throw new DomainError('VALIDATION_FAILED', 'sourceId must be a UUID.', 400);
    }
    if ((decision !== 'approved' && decision !== 'rejected') || rationale.trim().length < 10 || rationale.length > 2_000) {
      throw new DomainError('VALIDATION_FAILED', 'Evidence review requires an approved/rejected decision and a 10–2000 character rationale.', 400);
    }
    return this.repository.transaction(() => {
      const source = this.repository.getEvidenceSource(actor.tenantId, sourceId);
      if (source === undefined) {
        throw new DomainError('NOT_FOUND', 'Evidence source was not found for this tenant.', 404);
      }
      if (source.status !== 'pending_review') {
        throw new DomainError('CONFLICT', 'Only a pending evidence source may receive an immutable review.', 409);
      }
      const review: EvidenceSourceReview = { reviewId: randomUUID(), sourceId, tenantId: actor.tenantId, reviewerId: actor.id, decision, rationale: rationale.trim(), occurredAt: this.clock.now() };
      this.repository.saveEvidenceSourceReview(review, actor, randomUUID());
      return { ...source, status: decision, reviewedAt: review.occurredAt };
    });
  }
  /** Revokes a previously approved source when its rights basis is no longer valid. */
  public revokeEvidenceSource(actor: Actor, sourceId: string, rationale: string): EvidenceSource {
    assertActor(actor, ['evidence_reviewer']);
    if (!/^[0-9a-f-]{36}$/i.test(sourceId) || rationale.trim().length < 10 || rationale.length > 2_000) {
      throw new DomainError('VALIDATION_FAILED', 'Evidence revocation requires a UUID sourceId and a 10–2000 character rationale.', 400);
    }
    return this.repository.transaction(() => {
      const source = this.repository.getEvidenceSource(actor.tenantId, sourceId);
      if (source === undefined) {
        throw new DomainError('NOT_FOUND', 'Evidence source was not found for this tenant.', 404);
      }
      if (source.status !== 'approved') {
        throw new DomainError('CONFLICT', 'Only an approved evidence source may be revoked.', 409);
      }
      const revocation: EvidenceSourceRevocation = { revocationId: randomUUID(), sourceId, tenantId: actor.tenantId, revokerId: actor.id, rationale: rationale.trim(), occurredAt: this.clock.now() };
      this.repository.saveEvidenceSourceRevocation(revocation, actor, randomUUID());
      return { ...source, status: 'revoked' };
    });
  }

  /** Creates one director-approved synthetic structural assertion; no inference or corpus text is involved. */
  public createGraphAssertion(actor: Actor, input: unknown): GraphAssertion {
    assertActor(actor, ['operator']);
    const registration = parseGraphAssertionRegistration(input);
    assertTenant(actor, registration.tenantId);
    return this.repository.transaction(() => {
      const evidence = this.repository.getEvidenceSource(registration.tenantId, registration.evidenceSourceId);
      if (evidence === undefined) {
        throw new DomainError('NOT_FOUND', 'Evidence source was not found for this tenant.', 404);
      }
      if (evidence.status !== 'approved') {
        throw new DomainError('CONFLICT', 'Only an approved, non-revoked evidence source may support a P6 graph assertion.', 409);
      }
      if (evidence.licenseBasis !== 'synthetic' || evidence.domain !== 'synthetic_test') {
        throw new DomainError('FORBIDDEN', 'P6 accepts synthetic evidence sources only until a separately approved corpus policy exists.', 403);
      }
      const createdAt = this.clock.now();
      const correlationId = randomUUID();
      const sourceNode = this.resolveGraphNode(registration.sourceNode, evidence, actor, createdAt, correlationId);
      const targetNode = this.resolveGraphNode(registration.targetNode, evidence, actor, createdAt, correlationId);
      if (this.repository.graphAssertionExists(registration.tenantId, sourceNode.graphNodeId, targetNode.graphNodeId, registration.edgeType, evidence.sourceId)) {
        throw new DomainError('CONFLICT', 'This immutable P6 graph assertion is already registered for the evidence source.', 409);
      }
      const assertion: GraphAssertion = {
        assertionId: randomUUID(), tenantId: registration.tenantId, sourceNode, targetNode, edgeType: registration.edgeType,
        evidenceSourceId: evidence.sourceId, evidenceSourceVersion: evidence.version, evidenceContentSha256: evidence.contentSha256, evidenceStatus: 'approved',
        epistemicTier: registration.epistemicTier, authorId: actor.id, authorRole: 'operator', confidence: 1, createdAt, correlationId,
      };
      this.repository.createGraphAssertion(assertion, actor);
      return assertion;
    });
  }

  /** Imports a bounded assertion set atomically; any invalid member rolls the entire fixture back. */
  public createGraphAssertions(actor: Actor, inputs: readonly unknown[]): GraphAssertion[] {
    assertActor(actor, ['operator']);
    if (inputs.length === 0 || inputs.length > 128) {
      throw new DomainError('VALIDATION_FAILED', 'P6 accepts 1–128 assertions per local transaction.', 400);
    }
    const registrations = inputs.map((input) => {
      const registration = parseGraphAssertionRegistration(input);
      assertTenant(actor, registration.tenantId);
      return registration;
    });
    return this.repository.transaction(() => registrations.map((registration) => this.createGraphAssertion(actor, registration)));
  }
  public listGraphAssertions(actor: Actor): GraphAssertion[] {
    assertActor(actor, ['operator', 'evidence_reviewer']);
    return this.repository.listGraphAssertions(actor.tenantId);
  }

  private resolveGraphNode(input: { key: string; label: string; type: GraphNode['type'] }, evidence: EvidenceSource, actor: Actor, createdAt: string, correlationId: string): GraphNode {
    const existing = this.repository.getGraphNode(actor.tenantId, input.type, input.key);
    if (existing !== undefined) {
      if (existing.label !== input.label || existing.evidenceSourceId !== evidence.sourceId || existing.evidenceContentSha256 !== evidence.contentSha256) {
        throw new DomainError('CONFLICT', 'A graph node identity is immutable and must retain its original synthetic evidence provenance.', 409);
      }
      return existing;
    }
    const node: GraphNode = {
      graphNodeId: randomUUID(), tenantId: actor.tenantId, key: input.key, label: input.label, type: input.type,
      evidenceSourceId: evidence.sourceId, evidenceContentSha256: evidence.contentSha256, authorId: actor.id, authorRole: 'operator',
      confidence: 1, createdAt, schemaVersion: GRAPH_SCHEMA_VERSION,
    };
    this.repository.createGraphNode(node, actor, correlationId);
    return node;
  }
  public listAudit(actor: Actor) {
    assertActor(actor, ['operator']);
    return this.repository.listAudit(actor.tenantId);
  }
}
