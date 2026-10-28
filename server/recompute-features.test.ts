import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PsyForgeService, type Clock } from './application/psyforge-service.js';
import { type Actor } from './domain/types.js';
import { PsyForgeRepository } from './persistence/repository.js';
import { parseFeatureRecomputationArguments, runFeatureRecomputation } from './recompute-features.js';

const directories: string[] = [];
const CLOCK: Clock = { now: () => '2026-08-21T12:00:00.000Z' };
const OPERATOR: Actor = { id: 'operator-1', role: 'operator', tenantId: 'studio-alpha' };
const INGESTOR: Actor = { id: 'ingestor-1', role: 'ingestor', tenantId: 'studio-alpha' };

afterEach(() => {
  while (directories.length > 0) {
    rmSync(directories.pop()!, { recursive: true, force: true });
  }
});

describe('P2 recompute-features command', () => {
  it('recomputes existing consented telemetry deterministically from exact local arguments', () => {
    const directory = mkdtempSync(join(tmpdir(), 'psyforge-recompute-'));
    directories.push(directory);
    const repository = new PsyForgeRepository(join(directory, 'psyforge.sqlite'));
    const service = new PsyForgeService(repository, CLOCK);
    service.grantConsent(OPERATOR, { tenantId: 'studio-alpha', subjectId: 'player-001', purpose: 'behavioral_analysis', policyVersion: 'consent-v1', grantedAt: '2026-08-01T00:00:00.000Z', expiresAt: '2026-09-01T00:00:00.000Z' });
    service.ingest(INGESTOR, { schemaVersion: '1.0', eventId: '00000000-0000-4000-8000-000000000001', tenantId: 'studio-alpha', subjectId: 'player-001', purpose: 'behavioral_analysis', eventType: 'session.ended', occurredAt: '2026-08-20T12:00:00.000Z', payload: { sessionId: 'session-001', durationSeconds: 900 } });
    repository.close();

    const argumentsValue = parseFeatureRecomputationArguments(['--data-dir', directory, '--tenant-id', 'studio-alpha', '--subject-id', 'player-001', '--window-end', '2026-08-21T12:00:00.000Z']);
    const first = runFeatureRecomputation(argumentsValue);
    const second = runFeatureRecomputation(argumentsValue);
    expect(second).toEqual(first);
    expect(first.features).toEqual([
      { featureKey: 'session_count_7d', value: 1, definitionVersion: '1.0' },
      { featureKey: 'active_day_count_7d', value: 1, definitionVersion: '1.0' },
      { featureKey: 'average_session_duration_seconds_7d', value: 900, definitionVersion: '1.0' },
      { featureKey: 'exploration_activity_ratio_7d', value: 0, definitionVersion: '1.0' },
    ]);
  });

  it('rejects malformed, duplicate, and unsafe command arguments before opening a database', () => {
    expect(() => parseFeatureRecomputationArguments(['--data-dir', 'data', '--tenant-id', 'studio-alpha'])).toThrow(/Usage/);
    expect(() => parseFeatureRecomputationArguments(['--data-dir', 'data', '--data-dir', 'elsewhere', '--subject-id', 'player-001', '--window-end', '2026-08-21T12:00:00.000Z'])).toThrow(/Usage/);
    expect(() => parseFeatureRecomputationArguments(['--data-dir', 'data', '--tenant-id', 'studio-alpha', '--subject-id', '../player', '--window-end', '2026-08-21T12:00:00.000Z'])).toThrow(/subject-id/);
    expect(() => parseFeatureRecomputationArguments(['--data-dir', 'data', '--tenant-id', 'studio-alpha', '--subject-id', 'player-001', '--window-end', 'not-a-date'])).toThrow(/window-end/);
    expect(() => parseFeatureRecomputationArguments(['--data-dir', 'data', '--tenant-id', 'studio-alpha', '--subject-id', 'player-001', '--window-end', '2026-02-30T12:00:00.000Z'])).toThrow(/window-end/);
    expect(() => parseFeatureRecomputationArguments(['--data-dir', 'data', '--tenant-id', 'studio-alpha', '--subject-id', 'player-001', '--window-end', '2026-08-21T12:00:00'])).toThrow(/window-end/);
  });
});