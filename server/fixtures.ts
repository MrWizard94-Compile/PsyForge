import { randomUUID } from 'node:crypto';
import type { ConsentGrant, TelemetryEvent } from './domain/types.js';

/** Synthetic non-personal fixture data for offline contract and workflow tests. */
export function createSyntheticTelemetryFixture(now = '2026-08-21T12:00:00.000Z'): { consent: ConsentGrant; events: TelemetryEvent[] } {
  const consent: ConsentGrant = {
    tenantId: 'studio-alpha',
    subjectId: 'synthetic-player-001',
    purpose: 'behavioral_analysis',
    policyVersion: 'consent-v1',
    grantedAt: '2026-08-01T00:00:00.000Z',
    expiresAt: '2026-09-01T00:00:00.000Z',
  };
  return {
    consent,
    events: [
      {
        schemaVersion: '1.0', eventId: randomUUID(), tenantId: consent.tenantId, subjectId: consent.subjectId, purpose: consent.purpose,
        eventType: 'session.ended', occurredAt: now, payload: { sessionId: 'synthetic-session-001', durationSeconds: 900 },
      },
      {
        schemaVersion: '1.0', eventId: randomUUID(), tenantId: consent.tenantId, subjectId: consent.subjectId, purpose: consent.purpose,
        eventType: 'activity.completed', occurredAt: now, payload: { activityType: 'exploration' },
      },
    ],
  };
}
