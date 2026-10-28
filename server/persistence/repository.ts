import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import {
  type Actor,
  type AuditEvent,
  type BaselineModelResult,
  type ConsentGrant,
  type EvidenceSource,
  type EvidenceSourceReview,
  type EvidenceSourceRevocation,
  type FeatureValue,
  type GraphAssertion,
  type GraphAssertionInvalidation,
  type GraphNode,
  type Recommendation,
  type ReviewDecision,
  type StoredTelemetryEvent,
  type TelemetryEvent,
} from '../domain/types.js';

type DatabaseRow = Record<string, unknown>;
type AuditWrite = Omit<AuditEvent, 'auditId' | 'actorId' | 'actorRole'> & { actor: Actor };

function jsonRecord(value: string): Record<string, string | number | boolean | null> {
  return JSON.parse(value) as Record<string, string | number | boolean | null>;
}

function evidenceSourceFromRow(row: DatabaseRow): EvidenceSource {
  return {
    sourceId: String(row.source_id), tenantId: String(row.tenant_id), sourceKey: String(row.source_key), version: String(row.version),
    title: String(row.title), stableCitation: String(row.stable_citation), publisher: String(row.publisher), publishedAt: String(row.published_at),
    domain: String(row.domain) as EvidenceSource['domain'], licenseBasis: String(row.license_basis) as EvidenceSource['licenseBasis'], rightsReference: String(row.rights_reference),
    contentSha256: String(row.content_sha256), contentBytes: Number(row.content_bytes), status: String(row.status) as EvidenceSource['status'],
    registeredAt: String(row.registered_at), reviewedAt: row.reviewed_at === null ? undefined : String(row.reviewed_at),
  };
}

function graphNodeFromRow(row: DatabaseRow, prefix = ''): GraphNode {
  const field = (name: string) => row[`${prefix}${name}`];
  return {
    graphNodeId: String(field('graph_node_id')), tenantId: String(field('tenant_id')), key: String(field('node_key')), label: String(field('label')),
    type: String(field('node_type')) as GraphNode['type'], evidenceSourceId: String(field('evidence_source_id')), evidenceContentSha256: String(field('evidence_content_sha256')),
    authorId: String(field('author_id')), authorRole: String(field('author_role')) as GraphNode['authorRole'], confidence: Number(field('confidence')) as 1,
    createdAt: String(field('created_at')), schemaVersion: String(field('schema_version')) as GraphNode['schemaVersion'],
  };
}

function graphAssertionFromRow(row: DatabaseRow): GraphAssertion {
  return {
    assertionId: String(row.assertion_id), tenantId: String(row.tenant_id), sourceNode: graphNodeFromRow(row, 'source_'), targetNode: graphNodeFromRow(row, 'target_'),
    edgeType: String(row.edge_type) as GraphAssertion['edgeType'], evidenceSourceId: String(row.evidence_source_id), evidenceSourceVersion: String(row.evidence_source_version),
    evidenceContentSha256: String(row.evidence_content_sha256), evidenceStatus: String(row.evidence_status) as GraphAssertion['evidenceStatus'],
    epistemicTier: String(row.epistemic_tier) as GraphAssertion['epistemicTier'], authorId: String(row.author_id), authorRole: String(row.author_role) as GraphAssertion['authorRole'],
    confidence: Number(row.confidence) as 1, createdAt: String(row.created_at), correlationId: String(row.correlation_id),
    invalidatedAt: row.invalidated_at === null ? undefined : String(row.invalidated_at),
  };
}
export class PsyForgeRepository {
  private readonly database: Database.Database;

  public constructor(databasePath: string) {
    if (databasePath !== ':memory:') {
      mkdirSync(dirname(databasePath), { recursive: true });
    }
    this.database = new Database(databasePath);
    this.database.pragma('journal_mode = WAL');
    this.database.pragma('foreign_keys = ON');
    this.database.pragma('trusted_schema = OFF');
    this.migrate();
  }

  public close(): void {
    this.database.close();
  }

  public transaction<T>(operation: () => T): T {
    return this.database.transaction(operation)();
  }

  public createConsent(grant: ConsentGrant, actor: Actor, occurredAt: string, correlationId: string): void {
    const grantId = randomUUID();
    this.database.prepare(`INSERT INTO consent_grants (grant_id, tenant_id, subject_id, purpose, policy_version, granted_at, expires_at, revoked_at)
      VALUES (@grantId, @tenantId, @subjectId, @purpose, @policyVersion, @grantedAt, @expiresAt, NULL)`).run({ grantId, ...grant });
    this.appendAudit({ occurredAt, tenantId: grant.tenantId, actor, action: 'consent.granted', targetType: 'consent_grant', targetId: grantId, outcome: 'accepted', correlationId, detail: { purpose: grant.purpose, policyVersion: grant.policyVersion } });
  }

  public revokeConsent(tenantId: string, subjectId: string, purpose: string, actor: Actor, occurredAt: string, correlationId: string): boolean {
    const result = this.database.prepare(`UPDATE consent_grants SET revoked_at = @occurredAt
      WHERE tenant_id = @tenantId AND subject_id = @subjectId AND purpose = @purpose AND revoked_at IS NULL`).run({ tenantId, subjectId, purpose, occurredAt });
    this.appendAudit({ occurredAt, tenantId, actor, action: 'consent.revoked', targetType: 'consent_grant', targetId: `${subjectId}:${purpose}`, outcome: result.changes > 0 ? 'completed' : 'ignored', correlationId, detail: { subjectId, purpose } });
    return result.changes > 0;
  }

  /**
   * Removes data that is operationally useful for an individual after consent
   * withdrawal. Immutable audit and completed review records remain under the
   * P0 governance-retention rule, but are stripped of the subject linkage and
   * source feature evidence.
   */
  public purgeSubjectOperationalData(tenantId: string, subjectId: string, actor: Actor, occurredAt: string, correlationId: string): { events: number; features: number; models: number; recommendations: number; retainedReviews: number } {
    const purgeReference = `purged-${randomUUID()}`;
    const events = this.database.prepare('DELETE FROM telemetry_events WHERE tenant_id = ? AND subject_id = ?').run(tenantId, subjectId).changes;
    const features = this.database.prepare('DELETE FROM feature_values WHERE tenant_id = ? AND subject_id = ?').run(tenantId, subjectId).changes;
    const recommendations = this.database.prepare(`DELETE FROM recommendations
      WHERE tenant_id = ? AND subject_id = ?
      AND NOT EXISTS (SELECT 1 FROM review_decisions WHERE review_decisions.recommendation_id = recommendations.recommendation_id)`).run(tenantId, subjectId).changes;
    const models = this.database.prepare(`DELETE FROM model_results
      WHERE tenant_id = ? AND subject_id = ?
      AND NOT EXISTS (SELECT 1 FROM recommendations WHERE recommendations.model_result_id = model_results.model_result_id)`).run(tenantId, subjectId).changes;
    const retainedReviews = this.database.prepare(`SELECT COUNT(*) AS count FROM recommendations
      WHERE tenant_id = ? AND subject_id = ?`).get(tenantId, subjectId) as DatabaseRow;
    if (Number(retainedReviews.count) > 0) {
      this.database.prepare(`UPDATE model_results
        SET subject_id = ?, feature_snapshot_json = '[]', explanation = 'Source data was deleted after consent revocation.'
        WHERE tenant_id = ? AND subject_id = ?`).run(purgeReference, tenantId, subjectId);
      this.database.prepare(`UPDATE recommendations SET subject_id = ?
        WHERE tenant_id = ? AND subject_id = ?`).run(purgeReference, tenantId, subjectId);
    }
    const result = { events, features, models, recommendations, retainedReviews: Number(retainedReviews.count) };
    this.appendAudit({ occurredAt, tenantId, actor, action: 'subject.operational_data_purged', targetType: 'subject_purge', targetId: purgeReference, outcome: 'completed', correlationId, detail: result });
    return result;
  }

  /** Stores provenance metadata only; source content is intentionally absent from this table. */
  public createEvidenceSource(source: EvidenceSource, actor: Actor, correlationId: string): void {
    this.database.prepare(`INSERT INTO evidence_sources (source_id, tenant_id, source_key, version, title, stable_citation, publisher, published_at, domain, license_basis, rights_reference, content_sha256, content_bytes, status, registered_at, reviewed_at)
      VALUES (@sourceId, @tenantId, @sourceKey, @version, @title, @stableCitation, @publisher, @publishedAt, @domain, @licenseBasis, @rightsReference, @contentSha256, @contentBytes, @status, @registeredAt, NULL)`).run(source);
    this.appendAudit({ occurredAt: source.registeredAt, tenantId: source.tenantId, actor, action: 'evidence.source_registered', targetType: 'evidence_source', targetId: source.sourceId, outcome: 'accepted', correlationId, detail: { sourceKey: source.sourceKey, version: source.version, contentSha256: source.contentSha256, contentBytes: source.contentBytes, licenseBasis: source.licenseBasis } });
  }

  /** Records a fail-closed registration rejection without retaining source content. */
  public appendRejectedEvidenceSourceAudit(tenantId: string, actor: Actor, sourceKey: string, version: string, reason: string, occurredAt: string, correlationId: string): void {
    this.appendAudit({ occurredAt, tenantId, actor, action: 'evidence.source_rejected', targetType: 'evidence_source_registration', targetId: `${sourceKey}:${version}`, outcome: 'rejected', correlationId, detail: { reason } });
  }
  public getEvidenceSource(tenantId: string, sourceId: string): EvidenceSource | undefined {
    const row = this.database.prepare(`SELECT source_id, tenant_id, source_key, version, title, stable_citation, publisher, published_at, domain, license_basis, rights_reference, content_sha256, content_bytes, status, registered_at, reviewed_at
      FROM evidence_sources WHERE tenant_id = ? AND source_id = ?`).get(tenantId, sourceId) as DatabaseRow | undefined;
    return row === undefined ? undefined : evidenceSourceFromRow(row);
  }

  public getEvidenceSourceByNaturalKey(tenantId: string, sourceKey: string, version: string): EvidenceSource | undefined {
    const row = this.database.prepare(`SELECT source_id, tenant_id, source_key, version, title, stable_citation, publisher, published_at, domain, license_basis, rights_reference, content_sha256, content_bytes, status, registered_at, reviewed_at
      FROM evidence_sources WHERE tenant_id = ? AND source_key = ? AND version = ?`).get(tenantId, sourceKey, version) as DatabaseRow | undefined;
    return row === undefined ? undefined : evidenceSourceFromRow(row);
  }

  /** Records a terminal rights revocation without retaining or returning source content. */
  public saveEvidenceSourceRevocation(revocation: EvidenceSourceRevocation, actor: Actor, correlationId: string): void {
    const update = this.database.prepare("UPDATE evidence_sources SET status = 'revoked' WHERE source_id = ? AND tenant_id = ? AND status = 'approved'").run(revocation.sourceId, revocation.tenantId);
    if (update.changes !== 1) {
      throw new Error('Evidence source revocation did not update exactly one approved source.');
    }
    this.database.prepare(`INSERT INTO evidence_source_revocations (revocation_id, source_id, tenant_id, revoker_id, rationale, occurred_at)
      VALUES (@revocationId, @sourceId, @tenantId, @revokerId, @rationale, @occurredAt)`).run(revocation);
    const invalidatedAssertionCount = this.invalidateGraphAssertionsForSource(revocation, actor, correlationId);
    this.appendAudit({ occurredAt: revocation.occurredAt, tenantId: revocation.tenantId, actor, action: 'evidence.source_revoked', targetType: 'evidence_source', targetId: revocation.sourceId, outcome: 'completed', correlationId, detail: { revokerId: revocation.revokerId, invalidatedAssertionCount } });
  }

  public listEvidenceSources(tenantId: string): EvidenceSource[] {
    const rows = this.database.prepare(`SELECT source_id, tenant_id, source_key, version, title, stable_citation, publisher, published_at, domain, license_basis, rights_reference, content_sha256, content_bytes, status, registered_at, reviewed_at
      FROM evidence_sources WHERE tenant_id = ? ORDER BY registered_at ASC, source_id ASC`).all(tenantId) as DatabaseRow[];
    return rows.map(evidenceSourceFromRow);
  }

  public saveEvidenceSourceReview(review: EvidenceSourceReview, actor: Actor, correlationId: string): void {
    this.database.prepare('UPDATE evidence_sources SET status = ?, reviewed_at = ? WHERE source_id = ? AND tenant_id = ? AND status = \'pending_review\'').run(review.decision, review.occurredAt, review.sourceId, review.tenantId);
    this.database.prepare(`INSERT INTO evidence_source_reviews (review_id, source_id, tenant_id, reviewer_id, decision, rationale, occurred_at)
      VALUES (@reviewId, @sourceId, @tenantId, @reviewerId, @decision, @rationale, @occurredAt)`).run(review);
    this.appendAudit({ occurredAt: review.occurredAt, tenantId: review.tenantId, actor, action: 'evidence.source_reviewed', targetType: 'evidence_source', targetId: review.sourceId, outcome: 'completed', correlationId, detail: { decision: review.decision, reviewerId: review.reviewerId } });
  }
  public hasActiveConsent(tenantId: string, subjectId: string, purpose: string, now: string): boolean {
    const row = this.database.prepare(`SELECT grant_id FROM consent_grants
      WHERE tenant_id = ? AND subject_id = ? AND purpose = ? AND revoked_at IS NULL AND expires_at > ?
      ORDER BY granted_at DESC LIMIT 1`).get(tenantId, subjectId, purpose, now) as DatabaseRow | undefined;
    return row !== undefined;
  }

  public eventExists(eventId: string): boolean {
    return this.database.prepare('SELECT event_id FROM telemetry_events WHERE event_id = ?').get(eventId) !== undefined;
  }

  public insertEvent(event: StoredTelemetryEvent, actor: Actor, correlationId: string): void {
    this.database.prepare(`INSERT INTO telemetry_events (event_id, tenant_id, subject_id, purpose, schema_version, event_type, occurred_at, received_at, payload_json)
      VALUES (@eventId, @tenantId, @subjectId, @purpose, @schemaVersion, @eventType, @occurredAt, @receivedAt, @payloadJson)`).run({ ...event, payloadJson: JSON.stringify(event.payload) });
    this.appendAudit({ occurredAt: event.receivedAt, tenantId: event.tenantId, actor, action: 'telemetry.ingested', targetType: 'telemetry_event', targetId: event.eventId, outcome: 'accepted', correlationId, detail: { eventType: event.eventType, subjectId: event.subjectId } });
  }

  public appendRejectedEventAudit(tenantId: string, actor: Actor, eventId: string, code: string, occurredAt: string, correlationId: string): void {
    this.appendAudit({ occurredAt, tenantId, actor, action: 'telemetry.rejected', targetType: 'telemetry_event', targetId: eventId, outcome: 'rejected', correlationId, detail: { code } });
  }

  public appendDuplicateEventAudit(tenantId: string, actor: Actor, eventId: string, occurredAt: string, correlationId: string): void {
    this.appendAudit({ occurredAt, tenantId, actor, action: 'telemetry.duplicate_ignored', targetType: 'telemetry_event', targetId: eventId, outcome: 'ignored', correlationId, detail: {} });
  }

  public listEvents(tenantId: string, subjectId: string): StoredTelemetryEvent[] {
    const rows = this.database.prepare(`SELECT event_id, tenant_id, subject_id, purpose, schema_version, event_type, occurred_at, received_at, payload_json
      FROM telemetry_events WHERE tenant_id = ? AND subject_id = ? ORDER BY occurred_at ASC, event_id ASC`).all(tenantId, subjectId) as DatabaseRow[];
    return rows.map((row) => ({
      eventId: String(row.event_id),
      tenantId: String(row.tenant_id),
      subjectId: String(row.subject_id),
      purpose: 'behavioral_analysis',
      schemaVersion: '1.0',
      eventType: String(row.event_type) as TelemetryEvent['eventType'],
      occurredAt: String(row.occurred_at),
      receivedAt: String(row.received_at),
      payload: JSON.parse(String(row.payload_json)),
    }) as StoredTelemetryEvent);
  }

  public replaceFeatures(features: FeatureValue[], actor: Actor, correlationId: string): void {
    const first = features[0];
    if (first === undefined) {
      return;
    }
    this.database.prepare('DELETE FROM feature_values WHERE tenant_id = ? AND subject_id = ?').run(first.tenantId, first.subjectId);
    const insert = this.database.prepare(`INSERT INTO feature_values (feature_id, feature_key, tenant_id, subject_id, window_start, window_end, value, unit, epistemic_tier, source_event_ids_json, definition_version, computed_at)
      VALUES (@featureId, @featureKey, @tenantId, @subjectId, @windowStart, @windowEnd, @value, @unit, @epistemicTier, @sourceEventIdsJson, @definitionVersion, @computedAt)`);
    for (const feature of features) {
      insert.run({ ...feature, featureId: randomUUID(), sourceEventIdsJson: JSON.stringify(feature.sourceEventIds) });
    }
    this.appendAudit({ occurredAt: first.computedAt, tenantId: first.tenantId, actor, action: 'features.recomputed', targetType: 'feature_set', targetId: first.subjectId, outcome: 'completed', correlationId, detail: { count: features.length, definitionVersion: first.definitionVersion } });
  }

  public saveModelResult(result: BaselineModelResult, actor: Actor, correlationId: string): void {
    this.database.prepare(`INSERT INTO model_results (model_result_id, tenant_id, subject_id, model_version, computed_at, engagement_index, confidence, explanation, feature_snapshot_json)
      VALUES (@modelResultId, @tenantId, @subjectId, @modelVersion, @computedAt, @engagementIndex, @confidence, @explanation, @featureSnapshotJson)`).run({ ...result, featureSnapshotJson: JSON.stringify(result.featureSnapshot) });
    this.appendAudit({ occurredAt: result.computedAt, tenantId: result.tenantId, actor, action: 'model.baseline_computed', targetType: 'model_result', targetId: result.modelResultId, outcome: 'completed', correlationId, detail: { modelVersion: result.modelVersion, confidence: result.confidence } });
  }

  public getModelResult(tenantId: string, modelResultId: string): BaselineModelResult | undefined {
    const row = this.database.prepare(`SELECT model_result_id, tenant_id, subject_id, model_version, computed_at, engagement_index, confidence, explanation, feature_snapshot_json
      FROM model_results WHERE tenant_id = ? AND model_result_id = ?`).get(tenantId, modelResultId) as DatabaseRow | undefined;
    if (row === undefined) {
      return undefined;
    }
    return {
      modelResultId: String(row.model_result_id), tenantId: String(row.tenant_id), subjectId: String(row.subject_id), modelVersion: String(row.model_version), computedAt: String(row.computed_at),
      engagementIndex: Number(row.engagement_index), confidence: 'low', explanation: String(row.explanation), featureSnapshot: JSON.parse(String(row.feature_snapshot_json)) as FeatureValue[],
    };
  }

  public saveRecommendation(recommendation: Recommendation, actor: Actor, correlationId: string): void {
    this.database.prepare(`INSERT INTO recommendations (recommendation_id, tenant_id, subject_id, model_result_id, created_at, status, summary, uncertainty, ethics_score_json)
      VALUES (@recommendationId, @tenantId, @subjectId, @modelResultId, @createdAt, @status, @summary, @uncertainty, @ethicsScoreJson)`).run({ ...recommendation, ethicsScoreJson: JSON.stringify(recommendation.ethicsScore) });
    this.appendAudit({ occurredAt: recommendation.createdAt, tenantId: recommendation.tenantId, actor, action: 'recommendation.created', targetType: 'recommendation', targetId: recommendation.recommendationId, outcome: 'accepted', correlationId, detail: { modelResultId: recommendation.modelResultId } });
  }

  public getRecommendation(tenantId: string, recommendationId: string): Recommendation | undefined {
    const row = this.database.prepare(`SELECT recommendation_id, tenant_id, subject_id, model_result_id, created_at, status, summary, uncertainty, ethics_score_json
      FROM recommendations WHERE tenant_id = ? AND recommendation_id = ?`).get(tenantId, recommendationId) as DatabaseRow | undefined;
    if (row === undefined) {
      return undefined;
    }
    return { recommendationId: String(row.recommendation_id), tenantId: String(row.tenant_id), subjectId: String(row.subject_id), modelResultId: String(row.model_result_id), createdAt: String(row.created_at), status: String(row.status) as Recommendation['status'], summary: String(row.summary), uncertainty: String(row.uncertainty), ethicsScore: JSON.parse(String(row.ethics_score_json)) as Recommendation['ethicsScore'] };
  }

  public saveReviewDecision(decision: ReviewDecision, actor: Actor, correlationId: string): void {
    this.database.prepare('UPDATE recommendations SET status = ? WHERE recommendation_id = ? AND tenant_id = ?').run(decision.decision, decision.recommendationId, decision.tenantId);
    this.database.prepare(`INSERT INTO review_decisions (decision_id, recommendation_id, tenant_id, reviewer_id, reviewer_role, decision, rationale, occurred_at)
      VALUES (@decisionId, @recommendationId, @tenantId, @reviewerId, @reviewerRole, @decision, @rationale, @occurredAt)`).run(decision);
    this.appendAudit({ occurredAt: decision.occurredAt, tenantId: decision.tenantId, actor, action: 'recommendation.reviewed', targetType: 'recommendation', targetId: decision.recommendationId, outcome: 'completed', correlationId, detail: { decision: decision.decision } });
  }

  public getGraphNode(tenantId: string, type: GraphNode['type'], key: string): GraphNode | undefined {
    const row = this.database.prepare(`SELECT graph_node_id, tenant_id, node_key, label, node_type, evidence_source_id, evidence_content_sha256, author_id, author_role, confidence, created_at, schema_version
      FROM graph_nodes WHERE tenant_id = ? AND node_type = ? AND node_key = ?`).get(tenantId, type, key) as DatabaseRow | undefined;
    return row === undefined ? undefined : graphNodeFromRow(row);
  }

  public createGraphNode(node: GraphNode, actor: Actor, correlationId: string): void {
    this.database.prepare(`INSERT INTO graph_nodes (graph_node_id, tenant_id, node_key, label, node_type, evidence_source_id, evidence_content_sha256, author_id, author_role, confidence, created_at, schema_version)
      VALUES (@graphNodeId, @tenantId, @key, @label, @type, @evidenceSourceId, @evidenceContentSha256, @authorId, @authorRole, @confidence, @createdAt, @schemaVersion)`).run(node);
    this.appendAudit({ occurredAt: node.createdAt, tenantId: node.tenantId, actor, action: 'graph.node_created', targetType: 'graph_node', targetId: node.graphNodeId, outcome: 'accepted', correlationId, detail: { nodeType: node.type, nodeKey: node.key, evidenceSourceId: node.evidenceSourceId } });
  }

  public graphAssertionExists(tenantId: string, sourceNodeId: string, targetNodeId: string, edgeType: GraphAssertion['edgeType'], evidenceSourceId: string): boolean {
    const row = this.database.prepare(`SELECT assertion_id FROM graph_assertions
      WHERE tenant_id = ? AND source_node_id = ? AND target_node_id = ? AND edge_type = ? AND evidence_source_id = ?`).get(tenantId, sourceNodeId, targetNodeId, edgeType, evidenceSourceId) as DatabaseRow | undefined;
    return row !== undefined;
  }

  public createGraphAssertion(assertion: GraphAssertion, actor: Actor): void {
    this.database.prepare(`INSERT INTO graph_assertions (assertion_id, tenant_id, source_node_id, target_node_id, edge_type, evidence_source_id, evidence_source_version, evidence_content_sha256, epistemic_tier, author_id, author_role, confidence, created_at, correlation_id)
      VALUES (@assertionId, @tenantId, @sourceNodeId, @targetNodeId, @edgeType, @evidenceSourceId, @evidenceSourceVersion, @evidenceContentSha256, @epistemicTier, @authorId, @authorRole, @confidence, @createdAt, @correlationId)`).run({
      assertionId: assertion.assertionId, tenantId: assertion.tenantId, sourceNodeId: assertion.sourceNode.graphNodeId, targetNodeId: assertion.targetNode.graphNodeId,
      edgeType: assertion.edgeType, evidenceSourceId: assertion.evidenceSourceId, evidenceSourceVersion: assertion.evidenceSourceVersion,
      evidenceContentSha256: assertion.evidenceContentSha256, epistemicTier: assertion.epistemicTier, authorId: assertion.authorId,
      authorRole: assertion.authorRole, confidence: assertion.confidence, createdAt: assertion.createdAt, correlationId: assertion.correlationId,
    });
    this.appendAudit({ occurredAt: assertion.createdAt, tenantId: assertion.tenantId, actor, action: 'graph.assertion_created', targetType: 'graph_assertion', targetId: assertion.assertionId, outcome: 'accepted', correlationId: assertion.correlationId, detail: { edgeType: assertion.edgeType, evidenceSourceId: assertion.evidenceSourceId, epistemicTier: assertion.epistemicTier } });
  }

  public listGraphAssertions(tenantId: string): GraphAssertion[] {
    const rows = this.database.prepare(`SELECT
      assertion.assertion_id, assertion.tenant_id, assertion.edge_type, assertion.evidence_source_id, assertion.evidence_source_version, assertion.evidence_content_sha256, assertion.epistemic_tier, assertion.author_id, assertion.author_role, assertion.confidence, assertion.created_at, assertion.correlation_id,
      evidence.status AS evidence_status, invalidation.invalidated_at,
      source.graph_node_id AS source_graph_node_id, source.tenant_id AS source_tenant_id, source.node_key AS source_node_key, source.label AS source_label, source.node_type AS source_node_type, source.evidence_source_id AS source_evidence_source_id, source.evidence_content_sha256 AS source_evidence_content_sha256, source.author_id AS source_author_id, source.author_role AS source_author_role, source.confidence AS source_confidence, source.created_at AS source_created_at, source.schema_version AS source_schema_version,
      target.graph_node_id AS target_graph_node_id, target.tenant_id AS target_tenant_id, target.node_key AS target_node_key, target.label AS target_label, target.node_type AS target_node_type, target.evidence_source_id AS target_evidence_source_id, target.evidence_content_sha256 AS target_evidence_content_sha256, target.author_id AS target_author_id, target.author_role AS target_author_role, target.confidence AS target_confidence, target.created_at AS target_created_at, target.schema_version AS target_schema_version
      FROM graph_assertions assertion
      JOIN graph_nodes source ON source.graph_node_id = assertion.source_node_id
      JOIN graph_nodes target ON target.graph_node_id = assertion.target_node_id
      JOIN evidence_sources evidence ON evidence.source_id = assertion.evidence_source_id AND evidence.tenant_id = assertion.tenant_id
      LEFT JOIN graph_assertion_invalidations invalidation ON invalidation.assertion_id = assertion.assertion_id
      WHERE assertion.tenant_id = ?
      ORDER BY source.node_key ASC, target.node_key ASC, assertion.edge_type ASC, assertion.assertion_id ASC`).all(tenantId) as DatabaseRow[];
    return rows.map(graphAssertionFromRow);
  }

  private invalidateGraphAssertionsForSource(revocation: EvidenceSourceRevocation, actor: Actor, correlationId: string): number {
    const assertionRows = this.database.prepare(`SELECT assertion_id FROM graph_assertions assertion
      WHERE assertion.tenant_id = ? AND assertion.evidence_source_id = ?
      AND NOT EXISTS (SELECT 1 FROM graph_assertion_invalidations invalidation WHERE invalidation.assertion_id = assertion.assertion_id)`).all(revocation.tenantId, revocation.sourceId) as DatabaseRow[];
    const insert = this.database.prepare(`INSERT INTO graph_assertion_invalidations (invalidation_id, assertion_id, tenant_id, evidence_source_id, invalidated_at, reason)
      VALUES (@invalidationId, @assertionId, @tenantId, @evidenceSourceId, @invalidatedAt, @reason)`);
    for (const row of assertionRows) {
      const invalidation: GraphAssertionInvalidation = {
        invalidationId: randomUUID(), assertionId: String(row.assertion_id), tenantId: revocation.tenantId, evidenceSourceId: revocation.sourceId,
        invalidatedAt: revocation.occurredAt, reason: 'evidence_rights_revoked',
      };
      insert.run(invalidation);
    }
    this.appendAudit({ occurredAt: revocation.occurredAt, tenantId: revocation.tenantId, actor, action: 'graph.assertions_invalidated', targetType: 'evidence_source', targetId: revocation.sourceId, outcome: 'completed', correlationId, detail: { assertionCount: assertionRows.length, reason: 'evidence_rights_revoked' } });
    return assertionRows.length;
  }
  public listAudit(tenantId: string): AuditEvent[] {
    const rows = this.database.prepare(`SELECT audit_id, occurred_at, tenant_id, actor_id, actor_role, action, target_type, target_id, outcome, correlation_id, detail_json
      FROM audit_events WHERE tenant_id = ? ORDER BY rowid ASC`).all(tenantId) as DatabaseRow[];
    return rows.map((row) => ({ auditId: String(row.audit_id), occurredAt: String(row.occurred_at), tenantId: String(row.tenant_id), actorId: String(row.actor_id), actorRole: String(row.actor_role) as Actor['role'], action: String(row.action), targetType: String(row.target_type), targetId: String(row.target_id), outcome: String(row.outcome) as AuditEvent['outcome'], correlationId: String(row.correlation_id), detail: jsonRecord(String(row.detail_json)) }));
  }

  private appendAudit(input: AuditWrite): void {
    this.database.prepare(`INSERT INTO audit_events (audit_id, occurred_at, tenant_id, actor_id, actor_role, action, target_type, target_id, outcome, correlation_id, detail_json)
      VALUES (@auditId, @occurredAt, @tenantId, @actorId, @actorRole, @action, @targetType, @targetId, @outcome, @correlationId, @detailJson)`).run({ auditId: randomUUID(), occurredAt: input.occurredAt, tenantId: input.tenantId, actorId: input.actor.id, actorRole: input.actor.role, action: input.action, targetType: input.targetType, targetId: input.targetId, outcome: input.outcome, correlationId: input.correlationId, detailJson: JSON.stringify(input.detail) });
  }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS consent_grants (grant_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_id TEXT NOT NULL, purpose TEXT NOT NULL, policy_version TEXT NOT NULL, granted_at TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT);
      CREATE TABLE IF NOT EXISTS telemetry_events (event_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_id TEXT NOT NULL, purpose TEXT NOT NULL, schema_version TEXT NOT NULL, event_type TEXT NOT NULL, occurred_at TEXT NOT NULL, received_at TEXT NOT NULL, payload_json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS feature_values (feature_id TEXT PRIMARY KEY, feature_key TEXT NOT NULL, tenant_id TEXT NOT NULL, subject_id TEXT NOT NULL, window_start TEXT NOT NULL, window_end TEXT NOT NULL, value REAL NOT NULL, unit TEXT NOT NULL, epistemic_tier TEXT NOT NULL, source_event_ids_json TEXT NOT NULL, definition_version TEXT NOT NULL, computed_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS model_results (model_result_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_id TEXT NOT NULL, model_version TEXT NOT NULL, computed_at TEXT NOT NULL, engagement_index REAL NOT NULL, confidence TEXT NOT NULL, explanation TEXT NOT NULL, feature_snapshot_json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS recommendations (recommendation_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_id TEXT NOT NULL, model_result_id TEXT NOT NULL REFERENCES model_results(model_result_id), created_at TEXT NOT NULL, status TEXT NOT NULL, summary TEXT NOT NULL, uncertainty TEXT NOT NULL, ethics_score_json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS review_decisions (decision_id TEXT PRIMARY KEY, recommendation_id TEXT NOT NULL REFERENCES recommendations(recommendation_id), tenant_id TEXT NOT NULL, reviewer_id TEXT NOT NULL, reviewer_role TEXT NOT NULL, decision TEXT NOT NULL, rationale TEXT NOT NULL, occurred_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit_events (audit_id TEXT PRIMARY KEY, occurred_at TEXT NOT NULL, tenant_id TEXT NOT NULL, actor_id TEXT NOT NULL, actor_role TEXT NOT NULL, action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, outcome TEXT NOT NULL, correlation_id TEXT NOT NULL, detail_json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS evidence_sources (source_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, source_key TEXT NOT NULL, version TEXT NOT NULL, title TEXT NOT NULL, stable_citation TEXT NOT NULL, publisher TEXT NOT NULL, published_at TEXT NOT NULL, domain TEXT NOT NULL, license_basis TEXT NOT NULL, rights_reference TEXT NOT NULL, content_sha256 TEXT NOT NULL, content_bytes INTEGER NOT NULL, status TEXT NOT NULL, registered_at TEXT NOT NULL, reviewed_at TEXT, UNIQUE(tenant_id, source_key, version));
      CREATE TABLE IF NOT EXISTS evidence_source_reviews (review_id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES evidence_sources(source_id), tenant_id TEXT NOT NULL, reviewer_id TEXT NOT NULL, decision TEXT NOT NULL, rationale TEXT NOT NULL, occurred_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS evidence_source_revocations (revocation_id TEXT PRIMARY KEY, source_id TEXT NOT NULL UNIQUE REFERENCES evidence_sources(source_id), tenant_id TEXT NOT NULL, revoker_id TEXT NOT NULL, rationale TEXT NOT NULL, occurred_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS graph_nodes (graph_node_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, node_key TEXT NOT NULL, label TEXT NOT NULL, node_type TEXT NOT NULL CHECK(node_type IN ('corpus_concept', 'domain_entity')), evidence_source_id TEXT NOT NULL REFERENCES evidence_sources(source_id), evidence_content_sha256 TEXT NOT NULL, author_id TEXT NOT NULL, author_role TEXT NOT NULL CHECK(author_role = 'operator'), confidence REAL NOT NULL CHECK(confidence = 1), created_at TEXT NOT NULL, schema_version TEXT NOT NULL CHECK(schema_version = '1.0'), UNIQUE(tenant_id, node_type, node_key));
      CREATE TABLE IF NOT EXISTS graph_assertions (assertion_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, source_node_id TEXT NOT NULL REFERENCES graph_nodes(graph_node_id), target_node_id TEXT NOT NULL REFERENCES graph_nodes(graph_node_id), edge_type TEXT NOT NULL CHECK(edge_type = 'belongs_to'), evidence_source_id TEXT NOT NULL REFERENCES evidence_sources(source_id), evidence_source_version TEXT NOT NULL, evidence_content_sha256 TEXT NOT NULL, epistemic_tier TEXT NOT NULL CHECK(epistemic_tier = 'observed'), author_id TEXT NOT NULL, author_role TEXT NOT NULL CHECK(author_role = 'operator'), confidence REAL NOT NULL CHECK(confidence = 1), created_at TEXT NOT NULL, correlation_id TEXT NOT NULL, UNIQUE(tenant_id, source_node_id, target_node_id, edge_type, evidence_source_id));
      CREATE TABLE IF NOT EXISTS graph_assertion_invalidations (invalidation_id TEXT PRIMARY KEY, assertion_id TEXT NOT NULL UNIQUE REFERENCES graph_assertions(assertion_id), tenant_id TEXT NOT NULL, evidence_source_id TEXT NOT NULL REFERENCES evidence_sources(source_id), invalidated_at TEXT NOT NULL, reason TEXT NOT NULL CHECK(reason = 'evidence_rights_revoked'));
      CREATE INDEX IF NOT EXISTS graph_assertions_by_tenant ON graph_assertions (tenant_id, created_at, assertion_id);
      CREATE INDEX IF NOT EXISTS graph_assertions_by_evidence ON graph_assertions (tenant_id, evidence_source_id);      CREATE INDEX IF NOT EXISTS events_by_subject ON telemetry_events (tenant_id, subject_id, occurred_at);
      CREATE INDEX IF NOT EXISTS audits_by_tenant ON audit_events (tenant_id, occurred_at);
      CREATE INDEX IF NOT EXISTS evidence_sources_by_tenant ON evidence_sources (tenant_id, registered_at);
      CREATE TRIGGER IF NOT EXISTS graph_nodes_immutable_update BEFORE UPDATE ON graph_nodes BEGIN SELECT RAISE(ABORT, 'graph nodes are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS graph_nodes_immutable_delete BEFORE DELETE ON graph_nodes BEGIN SELECT RAISE(ABORT, 'graph nodes are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS graph_assertions_immutable_update BEFORE UPDATE ON graph_assertions BEGIN SELECT RAISE(ABORT, 'graph assertions are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS graph_assertions_immutable_delete BEFORE DELETE ON graph_assertions BEGIN SELECT RAISE(ABORT, 'graph assertions are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS graph_assertion_invalidations_immutable_update BEFORE UPDATE ON graph_assertion_invalidations BEGIN SELECT RAISE(ABORT, 'graph invalidations are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS graph_assertion_invalidations_immutable_delete BEFORE DELETE ON graph_assertion_invalidations BEGIN SELECT RAISE(ABORT, 'graph invalidations are immutable'); END;      CREATE TRIGGER IF NOT EXISTS audit_events_immutable_update BEFORE UPDATE ON audit_events BEGIN SELECT RAISE(ABORT, 'audit events are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS audit_events_immutable_delete BEFORE DELETE ON audit_events BEGIN SELECT RAISE(ABORT, 'audit events are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS review_decisions_immutable_update BEFORE UPDATE ON review_decisions BEGIN SELECT RAISE(ABORT, 'review decisions are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS review_decisions_immutable_delete BEFORE DELETE ON review_decisions BEGIN SELECT RAISE(ABORT, 'review decisions are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS evidence_source_reviews_immutable_update BEFORE UPDATE ON evidence_source_reviews BEGIN SELECT RAISE(ABORT, 'evidence source reviews are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS evidence_source_reviews_immutable_delete BEFORE DELETE ON evidence_source_reviews BEGIN SELECT RAISE(ABORT, 'evidence source reviews are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS evidence_source_revocations_immutable_update BEFORE UPDATE ON evidence_source_revocations BEGIN SELECT RAISE(ABORT, 'evidence source revocations are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS evidence_source_revocations_immutable_delete BEFORE DELETE ON evidence_source_revocations BEGIN SELECT RAISE(ABORT, 'evidence source revocations are immutable'); END;
    `);
  }
}
