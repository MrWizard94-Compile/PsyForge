import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { PsyForgeService, type Clock } from './application/psyforge-service.js';
import { DomainError, type Actor, type TelemetryEvent } from './domain/types.js';
import { PsyForgeRepository } from './persistence/repository.js';
import { createSyntheticTelemetryFixture } from './fixtures.js';

const NOW = '2026-08-21T12:00:00.000Z';
const CLOCK: Clock = { now: () => NOW };
const OPERATOR: Actor = { id: 'operator-1', role: 'operator', tenantId: 'studio-alpha' };
const INGESTOR: Actor = { id: 'ingestor-1', role: 'ingestor', tenantId: 'studio-alpha' };
const REVIEWER: Actor = { id: 'reviewer-1', role: 'reviewer', tenantId: 'studio-alpha' };
const ETHICS_REVIEWER: Actor = { id: 'ethics-1', role: 'ethics_reviewer', tenantId: 'studio-alpha' };
const EVIDENCE_REVIEWER: Actor = { id: 'evidence-1', role: 'evidence_reviewer', tenantId: 'studio-alpha' };
const OTHER_EVIDENCE_REVIEWER: Actor = { id: 'evidence-2', role: 'evidence_reviewer', tenantId: 'studio-bravo' };

function grant(subjectId = 'player-001', expiresAt = '2026-09-01T00:00:00.000Z') {
  return { tenantId: 'studio-alpha', subjectId, purpose: 'behavioral_analysis', policyVersion: 'consent-v1', grantedAt: '2026-08-01T00:00:00.000Z', expiresAt };
}

function event(overrides: Partial<TelemetryEvent> = {}): TelemetryEvent {
  return {
    schemaVersion: '1.0', eventId: randomUUID(), tenantId: 'studio-alpha', subjectId: 'player-001', purpose: 'behavioral_analysis', eventType: 'session.ended', occurredAt: '2026-08-20T12:00:00.000Z', payload: { sessionId: 'session-001', durationSeconds: 900 },
    ...overrides,
  } as TelemetryEvent;
}

function evidenceSource(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 'studio-alpha', sourceKey: 'synthetic-motivation-fixture', version: 'v1', title: 'Synthetic Motivation Fixture',
    stableCitation: 'internal:synthetic-motivation-fixture:v1', publisher: 'PsyForge test fixture', publishedAt: '2026-08-21T00:00:00.000Z',
    domain: 'synthetic_test', licenseBasis: 'synthetic', rightsReference: 'P5 synthetic test-data authorization',
    content: 'Synthetic local evidence content. It is used only to prove hashing and review behavior.',
    ...overrides,
  };
}

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'psyforge-test-'));
  const databasePath = join(directory, 'psyforge.sqlite');
  const repository = new PsyForgeRepository(databasePath);
  return { directory, databasePath, repository, service: new PsyForgeService(repository, CLOCK) };
}

describe('PsyForge local vertical slice', () => {
  const directories: string[] = [];

  afterEach(() => {
    while (directories.length > 0) {
      rmSync(directories.pop()!, { recursive: true, force: true });
    }
  });

  it('persists a consented event with an append-only audit record and ignores an exact replay', () => {
    const current = fixture();
    directories.push(current.directory);
    current.service.grantConsent(OPERATOR, grant());
    const telemetry = event();
    expect(current.service.ingest(INGESTOR, telemetry).status).toBe('accepted');
    expect(current.service.ingest(INGESTOR, telemetry).status).toBe('duplicate');
    const audit = current.service.listAudit(OPERATOR);
    expect(audit.map((entry) => entry.action)).toEqual(['consent.granted', 'telemetry.ingested', 'telemetry.duplicate_ignored']);
    current.repository.close();

    const reopened = new PsyForgeRepository(current.databasePath);
    const secondService = new PsyForgeService(reopened, CLOCK);
    expect(secondService.recomputeFeatures(OPERATOR, 'player-001').find((feature) => feature.featureKey === 'session_count_7d')?.value).toBe(1);
    reopened.close();
  });

  it('applies the documented deterministic event ordering policy before feature computation', () => {
    const current = fixture();
    directories.push(current.directory);
    current.service.grantConsent(OPERATOR, grant());
    const later = event({ eventId: '00000000-0000-4000-8000-000000000002', occurredAt: '2026-08-20T14:00:00.000Z' });
    const earlier = event({ eventId: '00000000-0000-4000-8000-000000000001', occurredAt: '2026-08-20T12:00:00.000Z' });
    current.service.ingest(INGESTOR, later);
    current.service.ingest(INGESTOR, earlier);
    expect(current.repository.listEvents('studio-alpha', 'player-001').map((stored) => stored.eventId)).toEqual([earlier.eventId, later.eventId]);
    current.repository.close();
  });
  it('provides a synthetic fixture generator that conforms to the approved P1 contract', () => {
    const current = fixture();
    directories.push(current.directory);
    const generated = createSyntheticTelemetryFixture(NOW);
    current.service.grantConsent(OPERATOR, generated.consent);
    for (const telemetry of generated.events) {
      expect(current.service.ingest(INGESTOR, telemetry).status).toBe('accepted');
    }
    expect(current.service.recomputeFeatures(OPERATOR, generated.consent.subjectId).find((feature) => feature.featureKey === 'exploration_activity_ratio_7d')?.value).toBe(1);
    current.repository.close();
  });

  it('rejects malformed, expired-consent, and cross-tenant events without storing them', () => {
    const current = fixture();
    directories.push(current.directory);
    current.service.grantConsent(OPERATOR, grant('expired-player', '2026-08-20T00:00:00.000Z'));
    expect(() => current.service.ingest(INGESTOR, { ...event(), payload: { sessionId: 'session-001', durationSeconds: 900, forbidden: true } })).toThrow(DomainError);
    expect(() => current.service.ingest(INGESTOR, event({ subjectId: 'expired-player' }))).toThrow(/No active consent/);
    expect(() => current.service.ingest(INGESTOR, event({ tenantId: 'studio-bravo' }))).toThrow(/Actor tenant/);
    expect(current.service.recomputeFeatures(OPERATOR, 'player-001').find((feature) => feature.featureKey === 'session_count_7d')?.value).toBe(0);
    expect(current.service.listAudit(OPERATOR).some((entry) => entry.action === 'telemetry.rejected')).toBe(true);
    current.repository.close();
  });

  it('produces stable bounded features and a low-confidence descriptive baseline', () => {
    const current = fixture();
    directories.push(current.directory);
    current.service.grantConsent(OPERATOR, grant());
    current.service.ingest(INGESTOR, event());
    current.service.ingest(INGESTOR, { ...event(), eventId: randomUUID(), eventType: 'activity.completed', occurredAt: '2026-08-20T13:00:00.000Z', payload: { activityType: 'exploration' } });
    const first = current.service.recomputeFeatures(OPERATOR, 'player-001');
    const second = current.service.recomputeFeatures(OPERATOR, 'player-001');
    expect(second).toEqual(first);
    expect(first.find((feature) => feature.featureKey === 'exploration_activity_ratio_7d')?.value).toBe(1);
    const model = current.service.buildBaselineModel(OPERATOR, 'player-001');
    expect(model.confidence).toBe('low');
    expect(model.explanation).toMatch(/descriptive baseline/);
    expect(model.engagementIndex).toBeGreaterThan(0);
    current.repository.close();
  });

  it('enforces human-only immutable review decisions and the ethics veto', () => {
    const current = fixture();
    directories.push(current.directory);
    current.service.grantConsent(OPERATOR, grant());
    current.service.ingest(INGESTOR, event());
    const model = current.service.buildBaselineModel(OPERATOR, 'player-001');
    const recommendation = current.service.createRecommendation(OPERATOR, model.modelResultId);
    expect(() => current.service.decideRecommendation(INGESTOR, recommendation.recommendationId, 'approved', 'The reviewer has considered the bounded baseline.')).toThrow(/not authorized/);
    expect(current.service.decideRecommendation(ETHICS_REVIEWER, recommendation.recommendationId, 'vetoed', 'The evidence scope is not sufficient for this recommendation.').status).toBe('vetoed');
    expect(() => current.service.decideRecommendation(REVIEWER, recommendation.recommendationId, 'approved', 'Attempting to bypass the immutable ethics decision.')).toThrow(/Only a pending recommendation/);
    current.repository.close();
  });

  it('revokes consent, purges operational subject data, and retains only scrubbed completed-review governance records', () => {
    const current = fixture();
    directories.push(current.directory);
    current.service.grantConsent(OPERATOR, grant());
    current.service.ingest(INGESTOR, event());
    const unreviewedModel = current.service.buildBaselineModel(OPERATOR, 'player-001');
    current.service.createRecommendation(OPERATOR, unreviewedModel.modelResultId);
    expect(current.service.revokeConsent(OPERATOR, 'player-001')).toBe(true);
    expect(current.service.recomputeFeatures(OPERATOR, 'player-001').every((feature) => feature.value === 0)).toBe(true);
    expect(() => current.service.ingest(INGESTOR, event())).toThrow(/No active consent/);

    current.service.grantConsent(OPERATOR, grant());
    current.service.ingest(INGESTOR, event());
    const reviewedModel = current.service.buildBaselineModel(OPERATOR, 'player-001');
    const reviewedRecommendation = current.service.createRecommendation(OPERATOR, reviewedModel.modelResultId);
    current.service.decideRecommendation(REVIEWER, reviewedRecommendation.recommendationId, 'approved', 'The evidence is limited and was reviewed by a human operator.');
    expect(current.service.revokeConsent(OPERATOR, 'player-001')).toBe(true);
    const retained = current.service.getRecommendation(OPERATOR, reviewedRecommendation.recommendationId);
    expect(retained.subjectId).toMatch(/^purged-/);
    expect(current.service.listAudit(OPERATOR).some((entry) => entry.action === 'subject.operational_data_purged')).toBe(true);
    current.repository.close();
  });

  it('rejects direct mutation of audit and review-decision records at the database layer', () => {
    const current = fixture();
    directories.push(current.directory);
    current.service.grantConsent(OPERATOR, grant());
    current.repository.close();
    const raw = new Database(current.databasePath);
    expect(() => raw.prepare('DELETE FROM audit_events').run()).toThrow(/immutable/);
    raw.close();
  });
  it('allows every reviewer decision disposition once and rejects direct review-history mutation', () => {
    const current = fixture();
    directories.push(current.directory);
    current.service.grantConsent(OPERATOR, grant());
    current.service.ingest(INGESTOR, event());
    const model = current.service.buildBaselineModel(OPERATOR, 'player-001');
    const approved = current.service.createRecommendation(OPERATOR, model.modelResultId);
    const rejected = current.service.createRecommendation(OPERATOR, model.modelResultId);
    const modified = current.service.createRecommendation(OPERATOR, model.modelResultId);
    expect(current.service.decideRecommendation(REVIEWER, approved.recommendationId, 'approved', 'The local descriptive baseline is accepted only for a documented human discussion.').status).toBe('approved');
    expect(current.service.decideRecommendation(REVIEWER, rejected.recommendationId, 'rejected', 'The local reviewer rejects this low-confidence baseline for the current discussion.').status).toBe('rejected');
    expect(current.service.decideRecommendation(REVIEWER, modified.recommendationId, 'modified', 'The local reviewer records a modified non-deployment interpretation for this baseline.').status).toBe('modified');
    current.repository.close();

    const raw = new Database(current.databasePath);
    expect(() => raw.prepare('UPDATE review_decisions SET rationale = \'rewritten\'').run()).toThrow(/immutable/);
    expect(() => raw.prepare('DELETE FROM review_decisions').run()).toThrow(/immutable/);
    raw.close();
  });

  it('refuses an unregistered persisted model version before it can enter the recommendation queue', () => {
    const current = fixture();
    directories.push(current.directory);
    current.service.grantConsent(OPERATOR, grant());
    current.service.ingest(INGESTOR, event());
    const model = current.service.buildBaselineModel(OPERATOR, 'player-001');
    current.repository.close();

    const raw = new Database(current.databasePath);
    raw.prepare('UPDATE model_results SET model_version = \'2.0\' WHERE model_result_id = ?').run(model.modelResultId);
    raw.close();

    const reopened = new PsyForgeRepository(current.databasePath);
    try {
      const service = new PsyForgeService(reopened, CLOCK);
      expect(() => service.createRecommendation(OPERATOR, model.modelResultId)).toThrow(/not registered/);
    } finally {
      reopened.close();
    }
  });
  it('registers metadata-only evidence, enforces role-separated tenant review, and preserves immutable terminal records', () => {
    const current = fixture();
    directories.push(current.directory);
    const source = current.service.registerEvidenceSource(OPERATOR, evidenceSource());
    expect(source.status).toBe('pending_review');
    expect(source.contentSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(current.service.listEvidenceSources(EVIDENCE_REVIEWER)).toEqual([source]);
    expect(current.service.listEvidenceSources(OTHER_EVIDENCE_REVIEWER)).toEqual([]);
    expect(() => current.service.reviewEvidenceSource(OTHER_EVIDENCE_REVIEWER, source.sourceId, 'approved', 'A cross-tenant evidence reviewer cannot inspect or approve this source.')).toThrow(/not found/);
    expect(() => current.service.registerEvidenceSource(OPERATOR, evidenceSource())).toThrow(/already exists/);
    expect(() => current.service.registerEvidenceSource(OPERATOR, evidenceSource({ content: 'Changed synthetic content must not replace the immutable registered version.' }))).toThrow(/does not match the immutable hash/);
    expect(() => current.service.registerEvidenceSource(OPERATOR, evidenceSource({ licenseBasis: 'unapproved-license' }))).toThrow(/licenseBasis/);
    const rejectionReasons = current.service.listAudit(OPERATOR)
      .filter((entry) => entry.action === 'evidence.source_rejected')
      .map((entry) => entry.detail.reason);
    expect(rejectionReasons).toEqual(['DUPLICATE_VERSION', 'EVIDENCE_HASH_MISMATCH', 'VALIDATION_FAILED']);
    expect(() => current.service.reviewEvidenceSource(REVIEWER, source.sourceId, 'approved', 'A different reviewer attempts to approve evidence without authority.')).toThrow(/not authorized/);
    expect(current.service.reviewEvidenceSource(EVIDENCE_REVIEWER, source.sourceId, 'approved', 'The synthetic fixture is traceable, bounded, and approved for local contract tests.').status).toBe('approved');
    expect(() => current.service.reviewEvidenceSource(EVIDENCE_REVIEWER, source.sourceId, 'rejected', 'An immutable evidence review must not receive a second terminal decision.')).toThrow(/Only a pending evidence source/);
    expect(() => current.service.revokeEvidenceSource(REVIEWER, source.sourceId, 'An unauthorized reviewer must not revoke an approved evidence source.')).toThrow(/not authorized/);
    expect(() => current.service.revokeEvidenceSource(OTHER_EVIDENCE_REVIEWER, source.sourceId, 'A cross-tenant reviewer cannot revoke this source.')).toThrow(/not found/);
    expect(current.service.revokeEvidenceSource(EVIDENCE_REVIEWER, source.sourceId, 'The synthetic source rights basis has been withdrawn for this local verification record.').status).toBe('revoked');
    expect(() => current.service.revokeEvidenceSource(EVIDENCE_REVIEWER, source.sourceId, 'A revoked source cannot be revoked again because the immutable revocation is terminal.')).toThrow(/Only an approved evidence source/);
    expect(current.service.listAudit(OPERATOR).some((entry) => entry.action === 'evidence.source_revoked')).toBe(true);
    current.repository.close();

    const raw = new Database(current.databasePath);
    const columns = raw.prepare('PRAGMA table_info(evidence_sources)').all() as Array<{ name: string }>;
    expect(columns.map((column) => column.name)).not.toContain('content');
    const persisted = raw.prepare('SELECT * FROM evidence_sources').get();
    expect(JSON.stringify(persisted)).not.toContain('Synthetic local evidence content');
    expect(() => raw.prepare('DELETE FROM evidence_source_reviews').run()).toThrow(/immutable/);
    expect(() => raw.prepare('DELETE FROM evidence_source_revocations').run()).toThrow(/immutable/);
    raw.close();
  });

});
