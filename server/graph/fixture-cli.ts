import { lstat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PsyForgeService } from '../application/psyforge-service.js';
import { DomainError, type Actor } from '../domain/types.js';
import { PsyForgeRepository } from '../persistence/repository.js';
import { readSyntheticGraphFixture, serializeSyntheticGraphFixture } from './synthetic-graph-fixture.js';

interface GraphFixtureArguments {
  mode: 'import' | 'export';
  dataDirectory: string;
  tenantId: string;
  fixturePath: string;
}

function requireIdentifier(value: string | undefined, name: string): string {
  if (value === undefined || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value)) {
    throw new DomainError('VALIDATION_FAILED', `${name} must be a 1–128 character opaque identifier.`, 400);
  }
  return value;
}

/** Parses an exact local-only graph-fixture import/export command. */
export function parseGraphFixtureArguments(argumentsList: string[]): GraphFixtureArguments {
  if (argumentsList.length !== 8) {
    throw new DomainError('VALIDATION_FAILED', 'Usage: npm run graph:fixture -- --mode <import|export> --data-dir <path> --tenant-id <opaque-id> --fixture <path>.', 400);
  }
  const values = new Map<string, string>();
  const allowed = new Set(['--mode', '--data-dir', '--tenant-id', '--fixture']);
  for (let index = 0; index < argumentsList.length; index += 2) {
    const key = argumentsList[index];
    const value = argumentsList[index + 1];
    if (key === undefined || value === undefined || !allowed.has(key) || values.has(key)) {
      throw new DomainError('VALIDATION_FAILED', 'Usage: npm run graph:fixture -- --mode <import|export> --data-dir <path> --tenant-id <opaque-id> --fixture <path>.', 400);
    }
    values.set(key, value);
  }
  const mode = values.get('--mode');
  const dataDirectory = values.get('--data-dir');
  const fixturePath = values.get('--fixture');
  if ((mode !== 'import' && mode !== 'export') || dataDirectory === undefined || dataDirectory.trim().length === 0 || fixturePath === undefined || fixturePath.trim().length === 0) {
    throw new DomainError('VALIDATION_FAILED', 'mode, data-dir, and fixture must be valid local values.', 400);
  }
  return { mode, dataDirectory: resolve(dataDirectory), tenantId: requireIdentifier(values.get('--tenant-id'), 'tenant-id'), fixturePath: resolve(fixturePath) };
}

export async function runGraphFixture(argumentsValue: GraphFixtureArguments): Promise<{ mode: 'import' | 'export'; assertionCount: number; fixturePath: string }> {
  const actor: Actor = { id: 'local-graph-fixture', role: 'operator', tenantId: argumentsValue.tenantId };
  const repository = new PsyForgeRepository(resolve(argumentsValue.dataDirectory, 'psyforge.sqlite'));
  try {
    const service = new PsyForgeService(repository);
    if (argumentsValue.mode === 'import') {
      const fixture = await readSyntheticGraphFixture(argumentsValue.fixturePath);
      if (fixture.tenantId !== actor.tenantId) {
        throw new DomainError('TENANT_MISMATCH', 'Fixture tenantId does not match --tenant-id.', 403);
      }
      const assertions = service.createGraphAssertions(actor, fixture.assertions.map((assertion) => ({ ...assertion, tenantId: actor.tenantId })));
      return { mode: 'import', assertionCount: assertions.length, fixturePath: argumentsValue.fixturePath };
    }
    const existing = await lstat(argumentsValue.fixturePath).then(() => true).catch(() => false);
    if (existing) {
      throw new DomainError('CONFLICT', 'Refusing to overwrite an existing graph fixture export.', 409);
    }
    const output = serializeSyntheticGraphFixture(actor.tenantId, service.listGraphAssertions(actor));
    await writeFile(argumentsValue.fixturePath, output, { encoding: 'utf8', flag: 'wx' });
    return { mode: 'export', assertionCount: JSON.parse(output).assertions.length as number, fixturePath: argumentsValue.fixturePath };
  } finally {
    repository.close();
  }
}

function isMainModule(): boolean {
  const entryPoint = process.argv[1];
  return entryPoint !== undefined && import.meta.url === pathToFileURL(entryPoint).href;
}

if (isMainModule()) {
  runGraphFixture(parseGraphFixtureArguments(process.argv.slice(2)))
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof DomainError ? error.message : 'Synthetic graph fixture operation failed.'}\n`);
      process.exitCode = 1;
    });
}