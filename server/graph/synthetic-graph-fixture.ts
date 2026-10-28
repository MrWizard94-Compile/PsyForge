import { lstat, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DomainError, GRAPH_SCHEMA_VERSION, type GraphAssertion, type GraphAssertionRegistration } from '../domain/types.js';
import { parseGraphAssertionRegistration } from '../domain/graph.js';

const MAX_FIXTURE_BYTES = 64 * 1024;
const MAX_ASSERTIONS = 128;

type JsonRecord = Record<string, unknown>;
type FixtureAssertion = Omit<GraphAssertionRegistration, 'tenantId'>;

export interface SyntheticGraphFixture {
  schemaVersion: typeof GRAPH_SCHEMA_VERSION;
  tenantId: string;
  assertions: FixtureAssertion[];
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireExactKeys(value: JsonRecord, keys: readonly string[], location: string): void {
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...keys].sort();
  if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) {
    throw new DomainError('VALIDATION_FAILED', `${location} contains missing or unsupported fields.`, 400);
  }
}

function parseFixture(value: unknown): SyntheticGraphFixture {
  if (!isRecord(value)) {
    throw new DomainError('VALIDATION_FAILED', 'Synthetic graph fixture must be an object.', 400);
  }
  requireExactKeys(value, ['assertions', 'schemaVersion', 'tenantId'], 'synthetic graph fixture');
  if (value.schemaVersion !== GRAPH_SCHEMA_VERSION || typeof value.tenantId !== 'string' || !Array.isArray(value.assertions) || value.assertions.length === 0 || value.assertions.length > MAX_ASSERTIONS) {
    throw new DomainError('VALIDATION_FAILED', `Synthetic graph fixture requires schemaVersion ${GRAPH_SCHEMA_VERSION}, a tenant, and 1–${MAX_ASSERTIONS} assertions.`, 400);
  }
  const assertions = value.assertions.map((assertion, index) => {
    if (!isRecord(assertion)) {
      throw new DomainError('VALIDATION_FAILED', `assertions[${index}] must be an object.`, 400);
    }
    const registration = parseGraphAssertionRegistration({ ...assertion, tenantId: value.tenantId });
    const { tenantId: _tenantId, ...fixtureAssertion } = registration;
    return fixtureAssertion;
  });
  return { schemaVersion: GRAPH_SCHEMA_VERSION, tenantId: value.tenantId, assertions };
}

/** Reads one bounded, regular local JSON fixture. URLs and source text are never accepted. */
export async function readSyntheticGraphFixture(path: string): Promise<SyntheticGraphFixture> {
  const resolvedPath = resolve(path);
  const metadata = await lstat(resolvedPath).catch(() => {
    throw new DomainError('NOT_FOUND', 'Synthetic graph fixture is missing.', 404);
  });
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size === 0 || metadata.size > MAX_FIXTURE_BYTES) {
    throw new DomainError('VALIDATION_FAILED', `Synthetic graph fixture must be a regular non-empty file no larger than ${MAX_FIXTURE_BYTES} bytes.`, 400);
  }
  let value: unknown;
  try {
    value = JSON.parse((await readFile(resolvedPath)).toString('utf8'));
  } catch {
    throw new DomainError('VALIDATION_FAILED', 'Synthetic graph fixture must contain valid UTF-8 JSON.', 400);
  }
  return parseFixture(value);
}

/** Produces byte-stable, bounded JSON for active synthetic P6 assertions only. */
export function serializeSyntheticGraphFixture(tenantId: string, assertions: readonly GraphAssertion[]): string {
  const active = assertions.filter((assertion) => assertion.invalidatedAt === undefined && assertion.evidenceStatus === 'approved');
  if (active.length > MAX_ASSERTIONS) {
    throw new DomainError('VALIDATION_FAILED', `Synthetic graph export exceeds the ${MAX_ASSERTIONS}-assertion P6 limit.`, 400);
  }
  const fixture: SyntheticGraphFixture = {
    schemaVersion: GRAPH_SCHEMA_VERSION,
    tenantId,
    assertions: [...active]
      .sort((left, right) => `${left.sourceNode.key}\u0000${left.targetNode.key}\u0000${left.assertionId}`.localeCompare(`${right.sourceNode.key}\u0000${right.targetNode.key}\u0000${right.assertionId}`))
      .map((assertion) => ({
        evidenceSourceId: assertion.evidenceSourceId,
        sourceNode: { key: assertion.sourceNode.key, label: assertion.sourceNode.label, type: assertion.sourceNode.type },
        targetNode: { key: assertion.targetNode.key, label: assertion.targetNode.label, type: assertion.targetNode.type },
        edgeType: assertion.edgeType,
        epistemicTier: assertion.epistemicTier,
      })),
  };
  return `${JSON.stringify(fixture, null, 2)}\n`;
}