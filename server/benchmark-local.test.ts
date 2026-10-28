import { describe, expect, it } from 'vitest';
import {
  LOCAL_RESOURCE_BUDGET,
  assessLocalResourceBudget,
  parseLocalResourceBenchmarkArguments,
  runLocalResourceBenchmark,
} from './benchmark-local.js';

describe('local P0 resource benchmark', () => {
  it('measures a deterministic in-memory synthetic workload without a local database file', () => {
    const result = runLocalResourceBenchmark(32);
    expect(result.eventCount).toBe(32);
    expect(result.acceptedEventCount).toBe(32);
    expect(result.featureCount).toBe(4);
    expect(result.modelConfidence).toBe('low');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.heapDeltaBytes).toBeGreaterThanOrEqual(0);
  });

  it('parses only bounded explicit event counts and evaluates the documented default budget', () => {
    expect(parseLocalResourceBenchmarkArguments([])).toBe(LOCAL_RESOURCE_BUDGET.eventCount);
    expect(parseLocalResourceBenchmarkArguments(['--events', '32'])).toBe(32);
    expect(() => parseLocalResourceBenchmarkArguments(['--events', '0'])).toThrow(/Usage/);
    expect(() => parseLocalResourceBenchmarkArguments(['--events', '10001'])).toThrow(/integer between/);
    expect(assessLocalResourceBudget({
      eventCount: LOCAL_RESOURCE_BUDGET.eventCount,
      acceptedEventCount: LOCAL_RESOURCE_BUDGET.eventCount,
      featureCount: 4,
      modelConfidence: 'low',
      durationMs: LOCAL_RESOURCE_BUDGET.maxDurationMs,
      heapDeltaBytes: LOCAL_RESOURCE_BUDGET.maxHeapDeltaBytes,
    }).passed).toBe(true);
    expect(assessLocalResourceBudget({
      eventCount: LOCAL_RESOURCE_BUDGET.eventCount,
      acceptedEventCount: LOCAL_RESOURCE_BUDGET.eventCount,
      featureCount: 4,
      modelConfidence: 'low',
      durationMs: LOCAL_RESOURCE_BUDGET.maxDurationMs + 1,
      heapDeltaBytes: LOCAL_RESOURCE_BUDGET.maxHeapDeltaBytes,
    }).passed).toBe(false);
  });
});