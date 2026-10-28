import { describe, expect, it } from 'vitest';
import { assertModelResultEligibleForRecommendation, evaluateBaselineDrift, getLocalModelRegistryEntry } from './model-registry.js';
import type { BaselineModelResult, FeatureValue } from './types.js';

const FEATURES: FeatureValue[] = [
  { featureKey: 'session_count_7d', tenantId: 'studio-alpha', subjectId: 'player-001', windowStart: '2026-08-14T12:00:00.000Z', windowEnd: '2026-08-21T12:00:00.000Z', value: 1, unit: 'count', epistemicTier: 'observed', sourceEventIds: [], definitionVersion: '1.0', computedAt: '2026-08-21T12:00:00.000Z' },
  { featureKey: 'active_day_count_7d', tenantId: 'studio-alpha', subjectId: 'player-001', windowStart: '2026-08-14T12:00:00.000Z', windowEnd: '2026-08-21T12:00:00.000Z', value: 1, unit: 'days', epistemicTier: 'observed', sourceEventIds: [], definitionVersion: '1.0', computedAt: '2026-08-21T12:00:00.000Z' },
  { featureKey: 'average_session_duration_seconds_7d', tenantId: 'studio-alpha', subjectId: 'player-001', windowStart: '2026-08-14T12:00:00.000Z', windowEnd: '2026-08-21T12:00:00.000Z', value: 900, unit: 'seconds', epistemicTier: 'observed', sourceEventIds: [], definitionVersion: '1.0', computedAt: '2026-08-21T12:00:00.000Z' },
  { featureKey: 'exploration_activity_ratio_7d', tenantId: 'studio-alpha', subjectId: 'player-001', windowStart: '2026-08-14T12:00:00.000Z', windowEnd: '2026-08-21T12:00:00.000Z', value: 0, unit: 'ratio', epistemicTier: 'observed', sourceEventIds: [], definitionVersion: '1.0', computedAt: '2026-08-21T12:00:00.000Z' },
];

function result(overrides: Partial<BaselineModelResult> = {}): BaselineModelResult {
  return {
    modelResultId: '00000000-0000-4000-8000-000000000001', tenantId: 'studio-alpha', subjectId: 'player-001', modelVersion: '1.0', computedAt: '2026-08-21T12:00:00.000Z',
    engagementIndex: 25, confidence: 'low', explanation: 'Synthetic descriptive baseline.', featureSnapshot: FEATURES,
    ...overrides,
  };
}

describe('P3 local model registry', () => {
  it('allows only the registered low-confidence descriptive baseline with the exact observed feature contract', () => {
    expect(getLocalModelRegistryEntry('1.0')?.status).toBe('local_review_only');
    expect(() => assertModelResultEligibleForRecommendation(result())).not.toThrow();
  });

  it('detects data-contract drift and rejects unregistered model results', () => {
    const entry = getLocalModelRegistryEntry('1.0');
    if (entry === undefined) {
      throw new Error('The declared local baseline registry entry is missing.');
    }
    expect(evaluateBaselineDrift(FEATURES.slice(0, 3), entry).map((signal) => signal.code)).toEqual(['FEATURE_SET_MISMATCH']);
    expect(getLocalModelRegistryEntry('2.0')).toBeUndefined();
    expect(() => assertModelResultEligibleForRecommendation(result({ featureSnapshot: [{ ...FEATURES[0], epistemicTier: 'inferred' }] }))).toThrow(/feature snapshot/);
  });
});