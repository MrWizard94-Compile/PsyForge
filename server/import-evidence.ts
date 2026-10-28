import { resolve } from 'node:path';
import { DomainError, type Actor } from './domain/types.js';
import { readLocalEvidenceFixture } from './evidence/local-source-import.js';
import { PsyForgeRepository } from './persistence/repository.js';
import { PsyForgeService } from './application/psyforge-service.js';

interface ImportArguments {
  dataDirectory: string;
  sourceDirectory: string;
  tenantId: string;
}

function parseArguments(argumentsList: string[]): ImportArguments {
  if (argumentsList.length !== 6) {
    throw new DomainError('VALIDATION_FAILED', 'Usage: npm run import:evidence -- --data-dir <path> --source-dir <path> --tenant-id <opaque-id>.', 400);
  }
  const values = new Map<string, string>();
  for (let index = 0; index < argumentsList.length; index += 2) {
    const key = argumentsList[index];
    const value = argumentsList[index + 1];
    if ((key !== '--data-dir' && key !== '--source-dir' && key !== '--tenant-id') || value === undefined || values.has(key)) {
      throw new DomainError('VALIDATION_FAILED', 'Usage: npm run import:evidence -- --data-dir <path> --source-dir <path> --tenant-id <opaque-id>.', 400);
    }
    values.set(key, value);
  }
  const dataDirectory = values.get('--data-dir');
  const sourceDirectory = values.get('--source-dir');
  const tenantId = values.get('--tenant-id');
  if (dataDirectory === undefined || sourceDirectory === undefined || tenantId === undefined) {
    throw new DomainError('VALIDATION_FAILED', 'Usage: npm run import:evidence -- --data-dir <path> --source-dir <path> --tenant-id <opaque-id>.', 400);
  }
  return { dataDirectory: resolve(dataDirectory), sourceDirectory: resolve(sourceDirectory), tenantId };
}

async function run(): Promise<void> {
  const argumentsValue = parseArguments(process.argv.slice(2));
  const registration = await readLocalEvidenceFixture(argumentsValue.sourceDirectory);
  if (registration.tenantId !== argumentsValue.tenantId) {
    throw new DomainError('TENANT_MISMATCH', 'Fixture tenantId does not match --tenant-id.', 403);
  }
  const actor: Actor = { id: 'local-evidence-importer', role: 'operator', tenantId: argumentsValue.tenantId };
  const repository = new PsyForgeRepository(resolve(argumentsValue.dataDirectory, 'psyforge.sqlite'));
  try {
    const source = new PsyForgeService(repository).registerEvidenceSource(actor, registration);
    process.stdout.write(JSON.stringify({ sourceId: source.sourceId, status: source.status, contentSha256: source.contentSha256, contentBytes: source.contentBytes }) + '\n');
  } finally {
    repository.close();
  }
}

run().catch((error: unknown) => {
  const message = error instanceof DomainError ? error.message : 'Evidence import failed.';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});