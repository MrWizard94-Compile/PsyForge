import {
  FEATURE_DEFINITION_VERSION,
  type FeatureValue,
  type StoredTelemetryEvent,
} from './types.js';

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function sortedIds(events: StoredTelemetryEvent[]): string[] {
  return events.map((event) => event.eventId).sort();
}

export function computeFeatures(
  tenantId: string,
  subjectId: string,
  events: StoredTelemetryEvent[],
  windowEnd: string,
  computedAt: string,
): FeatureValue[] {
  const end = Date.parse(windowEnd);
  const start = new Date(end - WINDOW_MS).toISOString();
  const windowEvents = events.filter((event) => Date.parse(event.occurredAt) >= Date.parse(start) && Date.parse(event.occurredAt) <= end);
  const sessionEvents = windowEvents.filter((event): event is Extract<StoredTelemetryEvent, { eventType: 'session.ended' }> => event.eventType === 'session.ended');
  const activityEvents = windowEvents.filter((event): event is Extract<StoredTelemetryEvent, { eventType: 'activity.completed' }> => event.eventType === 'activity.completed');
  const activeDays = new Set(windowEvents.map((event) => event.occurredAt.slice(0, 10))).size;
  const totalDuration = sessionEvents.reduce((total, event) => total + event.payload.durationSeconds, 0);
  const explorationCount = activityEvents.filter((event) => event.payload.activityType === 'exploration').length;
  const common = {
    tenantId,
    subjectId,
    windowStart: start,
    windowEnd,
    epistemicTier: 'observed' as const,
    definitionVersion: FEATURE_DEFINITION_VERSION,
    computedAt,
  };
  return [
    { ...common, featureKey: 'session_count_7d' as const, value: sessionEvents.length, unit: 'count' as const, sourceEventIds: sortedIds(sessionEvents) },
    { ...common, featureKey: 'active_day_count_7d' as const, value: activeDays, unit: 'days' as const, sourceEventIds: sortedIds(windowEvents) },
    { ...common, featureKey: 'average_session_duration_seconds_7d' as const, value: sessionEvents.length === 0 ? 0 : totalDuration / sessionEvents.length, unit: 'seconds' as const, sourceEventIds: sortedIds(sessionEvents) },
    { ...common, featureKey: 'exploration_activity_ratio_7d' as const, value: activityEvents.length === 0 ? 0 : explorationCount / activityEvents.length, unit: 'ratio' as const, sourceEventIds: sortedIds(activityEvents) },
  ];
}
