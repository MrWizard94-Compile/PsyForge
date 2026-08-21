import { randomUUID } from 'node:crypto';
import { BASELINE_MODEL_VERSION, type BaselineModelResult, type FeatureValue } from './types.js';

function feature(features: FeatureValue[], key: FeatureValue['featureKey']): number {
  return features.find((value) => value.featureKey === key)?.value ?? 0;
}

export function buildBaselineModel(features: FeatureValue[], computedAt: string): BaselineModelResult {
  const first = features[0];
  if (first === undefined) {
    throw new Error('At least one feature is required to build the baseline model.');
  }
  const sessions = feature(features, 'session_count_7d');
  const activeDays = feature(features, 'active_day_count_7d');
  const averageDuration = feature(features, 'average_session_duration_seconds_7d');
  const explorationRatio = feature(features, 'exploration_activity_ratio_7d');
  const engagementIndex = Math.round(Math.min(100, (Math.min(sessions / 7, 1) * 40) + (Math.min(activeDays / 7, 1) * 25) + (Math.min(averageDuration / 1800, 1) * 25) + (Math.min(explorationRatio, 1) * 10)) * 100) / 100;
  return {
    modelResultId: randomUUID(),
    tenantId: first.tenantId,
    subjectId: first.subjectId,
    modelVersion: BASELINE_MODEL_VERSION,
    computedAt,
    engagementIndex,
    confidence: 'low',
    explanation: `Observed seven-day activity produced an engagement index of ${engagementIndex}. This is a descriptive baseline, not a churn, purchase, vulnerability, or deployment prediction.`,
    featureSnapshot: features,
  };
}
