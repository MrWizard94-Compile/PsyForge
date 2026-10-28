import { pathToFileURL } from 'node:url';
import { PsyForgeService, type Clock } from './application/psyforge-service.js';
import { type Actor, type ConsentGrant, type TelemetryEvent } from './domain/types.js';
import { PsyForgeRepository } from './persistence/repository.js';

const BENCHMARK_NOW = '2026-08-21T12:00:00.000Z';
const MAX_EVENT_COUNT = 10_000;
const MEBIBYTE = 1024 * 1024;

export const LOCAL_RESOURCE_BUDGET = {
  eventCount: 1_000,
  maxDurationMs: 5_000,
  maxHeapDeltaBytes: 64 * MEBIBYTE,
} as const;

const BENCHMARK_CLOCK: Clock = { now: () => BENCHMARK_NOW };
const OPERATOR: Actor = { id: 'local-resource-operator', role: 'operator', tenantId: 'benchmark-tenant' };
const INGESTOR: Actor = { id: 'local-resource-ingestor', role: 'ingestor', tenantId: 'benchmark-tenant' };

export interface LocalResourceBenchmarkResult {
  eventCount: number;
  acceptedEventCount: number;
  featureCount: number;
  modelConfidence: 'low';
  durationMs: number;
  heapDeltaBytes: number;
}

export interface LocalResourceBudgetAssessment {
  passed: boolean;
  durationWithinBudget: boolean;
  heapWithinBudget: boolean;
}

function benchmarkConsent(): ConsentGrant {
  return {
    tenantId: OPERATOR.tenantId,
    subjectId: 'benchmark-subject',
    purpose: 'behavioral_analysis',
    policyVersion: 'benchmark-v1',
    grantedAt: '2026-08-01T00:00:00.000Z',
    expiresAt: '2026-09-01T00:00:00.000Z',
  };
}

function benchmarkEventId(index: number): string {
  return `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;
}

function createBenchmarkEvents(eventCount: number): TelemetryEvent[] {
  return Array.from({ length: eventCount }, (_, index): TelemetryEvent => {
    if (index % 2 === 0) {
      return {
        schemaVersion: '1.0',
        eventId: benchmarkEventId(index),
        tenantId: OPERATOR.tenantId,
        subjectId: 'benchmark-subject',
        purpose: 'behavioral_analysis',
        eventType: 'session.ended',
        occurredAt: BENCHMARK_NOW,
        payload: { sessionId: `benchmark-session-${index}`, durationSeconds: 900 },
      };
    }
    return {
      schemaVersion: '1.0',
      eventId: benchmarkEventId(index),
      tenantId: OPERATOR.tenantId,
      subjectId: 'benchmark-subject',
      purpose: 'behavioral_analysis',
      eventType: 'activity.completed',
      occurredAt: BENCHMARK_NOW,
      payload: { activityType: 'exploration' },
    };
  });
}

function assertEventCount(eventCount: number): void {
  if (!Number.isInteger(eventCount) || eventCount < 1 || eventCount > MAX_EVENT_COUNT) {
    throw new Error(`eventCount must be an integer between 1 and ${MAX_EVENT_COUNT}.`);
  }
}

/** Measures the fixed synthetic P0 workload without writing a local database file. */
export function runLocalResourceBenchmark(eventCount: number = LOCAL_RESOURCE_BUDGET.eventCount): LocalResourceBenchmarkResult {
  assertEventCount(eventCount);
  const repository = new PsyForgeRepository(':memory:');
  const heapBefore = process.memoryUsage().heapUsed;
  const startedAt = process.hrtime.bigint();
  try {
    const service = new PsyForgeService(repository, BENCHMARK_CLOCK);
    service.grantConsent(OPERATOR, benchmarkConsent());
    let acceptedEventCount = 0;
    for (const event of createBenchmarkEvents(eventCount)) {
      if (service.ingest(INGESTOR, event).status !== 'accepted') {
        throw new Error('The deterministic benchmark event was not accepted.');
      }
      acceptedEventCount += 1;
    }
    const features = service.recomputeFeatures(OPERATOR, 'benchmark-subject', BENCHMARK_NOW);
    const model = service.buildBaselineModel(OPERATOR, 'benchmark-subject', BENCHMARK_NOW);
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const heapDeltaBytes = Math.max(0, process.memoryUsage().heapUsed - heapBefore);
    return {
      eventCount,
      acceptedEventCount,
      featureCount: features.length,
      modelConfidence: model.confidence,
      durationMs: Number(durationMs.toFixed(3)),
      heapDeltaBytes,
    };
  } finally {
    repository.close();
  }
}

/** Applies the documented local P0 limits to a measurement. */
export function assessLocalResourceBudget(result: LocalResourceBenchmarkResult): LocalResourceBudgetAssessment {
  const durationWithinBudget = result.eventCount === LOCAL_RESOURCE_BUDGET.eventCount && result.durationMs <= LOCAL_RESOURCE_BUDGET.maxDurationMs;
  const heapWithinBudget = result.eventCount === LOCAL_RESOURCE_BUDGET.eventCount && result.heapDeltaBytes <= LOCAL_RESOURCE_BUDGET.maxHeapDeltaBytes;
  return { passed: durationWithinBudget && heapWithinBudget, durationWithinBudget, heapWithinBudget };
}

export function parseLocalResourceBenchmarkArguments(argumentsList: string[]): number {
  if (argumentsList.length === 0) {
    return LOCAL_RESOURCE_BUDGET.eventCount;
  }
  if (argumentsList.length === 2 && argumentsList[0] === '--events' && /^[1-9][0-9]*$/.test(argumentsList[1] ?? '')) {
    const eventCount = Number(argumentsList[1]);
    assertEventCount(eventCount);
    return eventCount;
  }
  throw new Error('Usage: npm run benchmark:local [-- --events <1-10000>]. The resource budget is evaluated only for the default 1000-event workload.');
}

function isMainModule(): boolean {
  const entryPoint = process.argv[1];
  return entryPoint !== undefined && import.meta.url === pathToFileURL(entryPoint).href;
}

if (isMainModule()) {
  try {
    const result = runLocalResourceBenchmark(parseLocalResourceBenchmarkArguments(process.argv.slice(2)));
    const assessment = assessLocalResourceBudget(result);
    process.stdout.write(`${JSON.stringify({ workload: LOCAL_RESOURCE_BUDGET, result, assessment })}\n`);
    if (!assessment.passed) {
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Local resource benchmark failed.';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}