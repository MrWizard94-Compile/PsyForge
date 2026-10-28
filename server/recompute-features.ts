import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PsyForgeService } from './application/psyforge-service.js';
import { DomainError, type Actor } from './domain/types.js';
import { normalizeIso8601Timestamp } from './domain/timestamps.js';
import { PsyForgeRepository } from './persistence/repository.js';

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

export interface FeatureRecomputationArguments {
  dataDirectory: string;
  tenantId: string;
  subjectId: string;
  windowEnd: string;
}

function requireOpaqueIdentifier(value: string | undefined, name: string): string {
  if (value === undefined || !IDENTIFIER_PATTERN.test(value)) {
    throw new DomainError('VALIDATION_FAILED', `${name} must be a 1–128 character opaque identifier.`, 400);
  }
  return value;
}

function requireTimestamp(value: string | undefined): string {
  return normalizeIso8601Timestamp(value, 'window-end');
}

/** Parses an exact, local-only recomputation command line. */
export function parseFeatureRecomputationArguments(argumentsList: string[]): FeatureRecomputationArguments {
  if (argumentsList.length !== 8) {
    throw new DomainError('VALIDATION_FAILED', 'Usage: npm run recompute:features -- --data-dir <path> --tenant-id <opaque-id> --subject-id <opaque-id> --window-end <ISO-8601>.', 400);
  }
  const values = new Map<string, string>();
  const allowedKeys = new Set(['--data-dir', '--tenant-id', '--subject-id', '--window-end']);
  for (let index = 0; index < argumentsList.length; index += 2) {
    const key = argumentsList[index];
    const value = argumentsList[index + 1];
    if (key === undefined || value === undefined || !allowedKeys.has(key) || values.has(key)) {
      throw new DomainError('VALIDATION_FAILED', 'Usage: npm run recompute:features -- --data-dir <path> --tenant-id <opaque-id> --subject-id <opaque-id> --window-end <ISO-8601>.', 400);
    }
    values.set(key, value);
  }
  const dataDirectory = values.get('--data-dir');
  if (dataDirectory === undefined || dataDirectory.trim().length === 0) {
    throw new DomainError('VALIDATION_FAILED', 'data-dir must be a non-empty local path.', 400);
  }
  return {
    dataDirectory: resolve(dataDirectory),
    tenantId: requireOpaqueIdentifier(values.get('--tenant-id'), 'tenant-id'),
    subjectId: requireOpaqueIdentifier(values.get('--subject-id'), 'subject-id'),
    windowEnd: requireTimestamp(values.get('--window-end')),
  };
}

/** Recomputes only existing local, consented telemetry into the declared P2 feature set. */
export function runFeatureRecomputation(argumentsValue: FeatureRecomputationArguments): { tenantId: string; subjectId: string; windowEnd: string; features: Array<{ featureKey: string; value: number; definitionVersion: string }> } {
  const actor: Actor = { id: 'local-feature-recompute', role: 'operator', tenantId: argumentsValue.tenantId };
  const repository = new PsyForgeRepository(resolve(argumentsValue.dataDirectory, 'psyforge.sqlite'));
  try {
    const features = new PsyForgeService(repository).recomputeFeatures(actor, argumentsValue.subjectId, argumentsValue.windowEnd);
    return {
      tenantId: argumentsValue.tenantId,
      subjectId: argumentsValue.subjectId,
      windowEnd: argumentsValue.windowEnd,
      features: features.map((feature) => ({ featureKey: feature.featureKey, value: feature.value, definitionVersion: feature.definitionVersion })),
    };
  } finally {
    repository.close();
  }
}

function isMainModule(): boolean {
  const entryPoint = process.argv[1];
  return entryPoint !== undefined && import.meta.url === pathToFileURL(entryPoint).href;
}

if (isMainModule()) {
  try {
    process.stdout.write(`${JSON.stringify(runFeatureRecomputation(parseFeatureRecomputationArguments(process.argv.slice(2))))}\n`);
  } catch (error) {
    const message = error instanceof DomainError ? error.message : 'Feature recomputation failed.';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}