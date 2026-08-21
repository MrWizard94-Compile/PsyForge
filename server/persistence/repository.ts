import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import {
  type Actor,
  type AuditEvent,
  type BaselineModelResult,
  type ConsentGrant,
  type FeatureValue,
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
      modelResultId: String(row.model_result_id), tenantId: String(row.tenant_id), subjectId: String(row.subject_id), modelVersion: '1.0', computedAt: String(row.computed_at),
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
      CREATE INDEX IF NOT EXISTS events_by_subject ON telemetry_events (tenant_id, subject_id, occurred_at);
      CREATE INDEX IF NOT EXISTS audits_by_tenant ON audit_events (tenant_id, occurred_at);
      CREATE TRIGGER IF NOT EXISTS audit_events_immutable_update BEFORE UPDATE ON audit_events BEGIN SELECT RAISE(ABORT, 'audit events are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS audit_events_immutable_delete BEFORE DELETE ON audit_events BEGIN SELECT RAISE(ABORT, 'audit events are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS review_decisions_immutable_update BEFORE UPDATE ON review_decisions BEGIN SELECT RAISE(ABORT, 'review decisions are immutable'); END;
      CREATE TRIGGER IF NOT EXISTS review_decisions_immutable_delete BEFORE DELETE ON review_decisions BEGIN SELECT RAISE(ABORT, 'review decisions are immutable'); END;
    `);
  }
}
