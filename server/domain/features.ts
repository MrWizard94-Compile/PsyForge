import { FEATURE_DEFINITIONS, selectFeatureEvents, type FeatureDefinition } from './feature-definitions.js';
import type { FeatureValue, StoredTelemetryEvent } from './types.js';

function sortedIds(events: StoredTelemetryEvent[]): string[] {
  return events.map((event) => event.eventId).sort();
}

function withinWindow(events: StoredTelemetryEvent[], windowEnd: string, windowDays: number): { windowStart: string; events: StoredTelemetryEvent[] } {
  const end = Date.parse(windowEnd);
  const windowStart = new Date(end - windowDays * 24 * 60 * 60 * 1000).toISOString();
  return {
    windowStart,
    events: events.filter((event) => Date.parse(event.occurredAt) >= Date.parse(windowStart) && Date.parse(event.occurredAt) <= end),
  };
}

function aggregateFeature(definition: FeatureDefinition, events: StoredTelemetryEvent[]): { value: number; sourceEvents: StoredTelemetryEvent[] } {
  const sourceEvents = selectFeatureEvents(events, definition.source);
  switch (definition.aggregation.kind) {
    case 'count':
      return { value: sourceEvents.length, sourceEvents };
    case 'distinct_occurrence_day':
      return { value: new Set(sourceEvents.map((event) => event.occurredAt.slice(0, 10))).size, sourceEvents };
    case 'mean_session_duration_seconds': {
      const sessionEvents = sourceEvents.filter((event): event is Extract<StoredTelemetryEvent, { eventType: 'session.ended' }> => event.eventType === 'session.ended');
      const totalDuration = sessionEvents.reduce((total, event) => total + event.payload.durationSeconds, 0);
      return { value: sessionEvents.length === 0 ? 0 : totalDuration / sessionEvents.length, sourceEvents: sessionEvents };
    }
    case 'ratio': {
      const numerator = selectFeatureEvents(events, definition.aggregation.numerator);
      const denominator = selectFeatureEvents(events, definition.aggregation.denominator);
      return { value: denominator.length === 0 ? 0 : numerator.length / denominator.length, sourceEvents: denominator };
    }
  }
}

/** Interprets the versioned P2 feature language over a bounded event window. */
export function computeFeatures(
  tenantId: string,
  subjectId: string,
  events: StoredTelemetryEvent[],
  windowEnd: string,
  computedAt: string,
): FeatureValue[] {
  return FEATURE_DEFINITIONS.map((definition) => {
    const window = withinWindow(events, windowEnd, definition.windowDays);
    const aggregate = aggregateFeature(definition, window.events);
    return {
      featureKey: definition.featureKey,
      tenantId,
      subjectId,
      windowStart: window.windowStart,
      windowEnd,
      value: aggregate.value,
      unit: definition.unit,
      epistemicTier: definition.epistemicTier,
      sourceEventIds: sortedIds(aggregate.sourceEvents),
      definitionVersion: definition.definitionVersion,
      computedAt,
    };
  });
}