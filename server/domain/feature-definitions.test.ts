import { describe, expect, it } from 'vitest';
import { assertFeatureDefinitionInvariants, FEATURE_DEFINITIONS, selectFeatureEvents } from './feature-definitions.js';
import type { StoredTelemetryEvent } from './types.js';

const EVENTS: StoredTelemetryEvent[] = [
  {
    schemaVersion: '1.0', eventId: '00000000-0000-4000-8000-000000000001', tenantId: 'studio-alpha', subjectId: 'player-001', purpose: 'behavioral_analysis',
    eventType: 'session.ended', occurredAt: '2026-08-20T12:00:00.000Z', receivedAt: '2026-08-20T12:00:01.000Z', payload: { sessionId: 'session-001', durationSeconds: 900 },
  },
  {
    schemaVersion: '1.0', eventId: '00000000-0000-4000-8000-000000000002', tenantId: 'studio-alpha', subjectId: 'player-001', purpose: 'behavioral_analysis',
    eventType: 'activity.completed', occurredAt: '2026-08-20T13:00:00.000Z', receivedAt: '2026-08-20T13:00:01.000Z', payload: { activityType: 'exploration' },
  },
];

describe('P2 feature definition language', () => {
  it('defines each approved local feature as versioned auditable data', () => {
    expect(FEATURE_DEFINITIONS.map((definition) => definition.featureKey)).toEqual([
      'session_count_7d',
      'active_day_count_7d',
      'average_session_duration_seconds_7d',
      'exploration_activity_ratio_7d',
    ]);
    expect(() => assertFeatureDefinitionInvariants()).not.toThrow();
  });

  it('rejects invalid declarative definitions and selects their declared event inputs', () => {
    const invalidDefinition = [{ ...FEATURE_DEFINITIONS[2], source: { eventType: 'activity.completed' as const } }];
    expect(() => assertFeatureDefinitionInvariants(invalidDefinition)).toThrow(/must select session\.ended/);
    expect(selectFeatureEvents(EVENTS, { eventType: 'activity.completed', activityType: 'exploration' })).toEqual([EVENTS[1]]);
  });
});