import { BASELINE_MODEL_VERSION, FEATURE_DEFINITION_VERSION, type BaselineModelResult, type FeatureValue, DomainError } from './types.js';

const REQUIRED_FEATURE_KEYS: readonly FeatureValue['featureKey'][] = [
  'session_count_7d',
  'active_day_count_7d',
  'average_session_duration_seconds_7d',
  'exploration_activity_ratio_7d',
];

export interface LocalModelRegistryEntry {
  modelVersion: typeof BASELINE_MODEL_VERSION;
  displayName: string;
  status: 'local_review_only';
  requiredFeatureDefinitionVersion: typeof FEATURE_DEFINITION_VERSION;
  requiredFeatureKeys: readonly FeatureValue['featureKey'][];
  requiredConfidence: 'low';
}

/** The executable registry for the only model eligible for the local P3/P4 workflow. */
export const LOCAL_MODEL_REGISTRY: readonly LocalModelRegistryEntry[] = Object.freeze([
  {
    modelVersion: BASELINE_MODEL_VERSION,
    displayName: 'Descriptive Engagement Baseline',
    status: 'local_review_only',
    requiredFeatureDefinitionVersion: FEATURE_DEFINITION_VERSION,
    requiredFeatureKeys: REQUIRED_FEATURE_KEYS,
    requiredConfidence: 'low',
  },
]);

export interface BaselineDriftSignal {
  code: 'FEATURE_SET_MISMATCH' | 'FEATURE_DEFINITION_VERSION_MISMATCH' | 'EPISTEMIC_TIER_MISMATCH';
  message: string;
}

export function getLocalModelRegistryEntry(modelVersion: string): LocalModelRegistryEntry | undefined {
  return LOCAL_MODEL_REGISTRY.find((entry) => entry.modelVersion === modelVersion);
}

/** Evaluates local data-contract drift; it intentionally does not claim statistical model monitoring. */
export function evaluateBaselineDrift(features: readonly FeatureValue[], entry: LocalModelRegistryEntry): BaselineDriftSignal[] {
  const actualKeys = [...features.map((feature) => feature.featureKey)].sort();
  const expectedKeys = [...entry.requiredFeatureKeys].sort();
  const signals: BaselineDriftSignal[] = [];
  if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) {
    signals.push({ code: 'FEATURE_SET_MISMATCH', message: 'The local feature snapshot does not match the registered baseline feature set.' });
  }
  if (features.some((feature) => feature.definitionVersion !== entry.requiredFeatureDefinitionVersion)) {
    signals.push({ code: 'FEATURE_DEFINITION_VERSION_MISMATCH', message: 'The local feature snapshot does not match the registered feature-definition version.' });
  }
  if (features.some((feature) => feature.epistemicTier !== 'observed')) {
    signals.push({ code: 'EPISTEMIC_TIER_MISMATCH', message: 'The local baseline accepts observed features only.' });
  }
  return signals;
}

/** Fails closed before a model result can create a P4 recommendation. */
export function assertModelResultEligibleForRecommendation(result: BaselineModelResult): void {
  const entry = getLocalModelRegistryEntry(result.modelVersion);
  if (entry === undefined || entry.status !== 'local_review_only') {
    throw new DomainError('MODEL_NOT_REGISTERED', 'The model result is not registered for the local review workflow.', 409);
  }
  if (result.confidence !== entry.requiredConfidence) {
    throw new DomainError('MODEL_NOT_REGISTERED', 'The model result confidence does not match its registered local-review contract.', 409);
  }
  const driftSignals = evaluateBaselineDrift(result.featureSnapshot, entry);
  if (driftSignals.length > 0) {
    throw new DomainError('MODEL_DRIFT_DETECTED', driftSignals.map((signal) => signal.message).join(' '), 409);
  }
}