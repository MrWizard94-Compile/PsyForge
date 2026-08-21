import { randomUUID } from 'node:crypto';
import { computeFeatures } from '../domain/features.js';
import { buildBaselineModel } from '../domain/model.js';
import {
  assertActor,
  assertTenant,
  parseConsentGrant,
  parseTelemetryEvent,
} from '../domain/validation.js';
import {
  type Actor,
  type BaselineModelResult,
  type ConsentGrant,
  type FeatureValue,
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

  public listAudit(actor: Actor) {
    assertActor(actor, ['operator']);
    return this.repository.listAudit(actor.tenantId);
  }
}
