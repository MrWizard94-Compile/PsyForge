import { FEATURE_DEFINITION_VERSION, type ActivityType, type FeatureValue, type StoredTelemetryEvent } from './types.js';

export type FeatureEventSelection =
  | { eventType: 'any' }
  | { eventType: 'session.ended' }
  | { eventType: 'activity.completed'; activityType?: ActivityType };

export type FeatureAggregation =
  | { kind: 'count' }
  | { kind: 'distinct_occurrence_day' }
  | { kind: 'mean_session_duration_seconds' }
  | { kind: 'ratio'; numerator: FeatureEventSelection; denominator: FeatureEventSelection };

/**
 * Declarative P2 feature language. Definitions name their inputs, window,
 * aggregation, unit, and epistemic tier; the executor interprets this data.
 */
export interface FeatureDefinition {
  featureKey: FeatureValue['featureKey'];
  windowDays: number;
  source: FeatureEventSelection;
  aggregation: FeatureAggregation;
  unit: FeatureValue['unit'];
  epistemicTier: FeatureValue['epistemicTier'];
  definitionVersion: typeof FEATURE_DEFINITION_VERSION;
}

export const FEATURE_DEFINITIONS: readonly FeatureDefinition[] = Object.freeze([
  {
    featureKey: 'session_count_7d',
    windowDays: 7,
    source: { eventType: 'session.ended' },
    aggregation: { kind: 'count' },
    unit: 'count',
    epistemicTier: 'observed',
    definitionVersion: FEATURE_DEFINITION_VERSION,
  },
  {
    featureKey: 'active_day_count_7d',
    windowDays: 7,
    source: { eventType: 'any' },
    aggregation: { kind: 'distinct_occurrence_day' },
    unit: 'days',
    epistemicTier: 'observed',
    definitionVersion: FEATURE_DEFINITION_VERSION,
  },
  {
    featureKey: 'average_session_duration_seconds_7d',
    windowDays: 7,
    source: { eventType: 'session.ended' },
    aggregation: { kind: 'mean_session_duration_seconds' },
    unit: 'seconds',
    epistemicTier: 'observed',
    definitionVersion: FEATURE_DEFINITION_VERSION,
  },
  {
    featureKey: 'exploration_activity_ratio_7d',
    windowDays: 7,
    source: { eventType: 'activity.completed' },
    aggregation: {
      kind: 'ratio',
      numerator: { eventType: 'activity.completed', activityType: 'exploration' },
      denominator: { eventType: 'activity.completed' },
    },
    unit: 'ratio',
    epistemicTier: 'observed',
    definitionVersion: FEATURE_DEFINITION_VERSION,
  },
]);

/** Rejects malformed edits to the feature language before a definition can run. */
export function assertFeatureDefinitionInvariants(definitions: readonly FeatureDefinition[] = FEATURE_DEFINITIONS): void {
  const featureKeys = new Set<string>();
  for (const definition of definitions) {
    if (featureKeys.has(definition.featureKey)) {
      throw new Error(`Feature definition ${definition.featureKey} is duplicated.`);
    }
    featureKeys.add(definition.featureKey);
    if (!Number.isInteger(definition.windowDays) || definition.windowDays < 1 || definition.windowDays > 365) {
      throw new Error(`Feature definition ${definition.featureKey} has an invalid window.`);
    }
    if (definition.definitionVersion !== FEATURE_DEFINITION_VERSION || definition.epistemicTier !== 'observed') {
      throw new Error(`Feature definition ${definition.featureKey} violates the P2 version or epistemic-tier contract.`);
    }
    if (definition.aggregation.kind === 'mean_session_duration_seconds' && definition.source.eventType !== 'session.ended') {
      throw new Error(`Feature definition ${definition.featureKey} must select session.ended events for session duration.`);
    }
  }
}

assertFeatureDefinitionInvariants();

export function selectFeatureEvents(events: StoredTelemetryEvent[], selection: FeatureEventSelection): StoredTelemetryEvent[] {
  if (selection.eventType === 'any') {
    return events;
  }
  if (selection.eventType === 'session.ended') {
    return events.filter((event) => event.eventType === 'session.ended');
  }
  return events.filter((event) => event.eventType === 'activity.completed' && (selection.activityType === undefined || event.payload.activityType === selection.activityType));
}