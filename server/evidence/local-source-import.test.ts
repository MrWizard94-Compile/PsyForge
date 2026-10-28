import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DomainError } from '../domain/types.js';
import { readLocalEvidenceFixture } from './local-source-import.js';

const directories: string[] = [];

function createFixture(overrides: Record<string, unknown> = {}): string {
  const directory = mkdtempSync(join(tmpdir(), 'psyforge-evidence-'));
  directories.push(directory);
  const manifest = {
    tenantId: 'studio-alpha', sourceKey: 'synthetic-import-fixture', version: 'v1', title: 'Synthetic Import Fixture',
    stableCitation: 'internal:synthetic-import-fixture:v1', publisher: 'PsyForge test fixture', publishedAt: '2026-08-21T00:00:00.000Z',
    domain: 'synthetic_test', licenseBasis: 'synthetic', rightsReference: 'P5 synthetic test-data authorization', ...overrides,
  };
  writeFileSync(join(directory, 'manifest.json'), JSON.stringify(manifest), 'utf8');
  writeFileSync(join(directory, 'source.txt'), 'Synthetic local fixture source content.', 'utf8');
  return directory;
}

describe('P5 local evidence fixture import', () => {
  afterEach(() => {
    while (directories.length > 0) {
      rmSync(directories.pop()!, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    }
  });

  it('reads a fixed local fixture without fetching or retaining a source path', async () => {
    const fixture = await readLocalEvidenceFixture(createFixture());
    expect(fixture.sourceKey).toBe('synthetic-import-fixture');
    expect(fixture.content).toBe('Synthetic local fixture source content.');
  });

  it('rejects unknown manifest fields and non-regular content files', async () => {
    await expect(readLocalEvidenceFixture(createFixture({ unapproved: true }))).rejects.toBeInstanceOf(DomainError);
    const directory = createFixture();
    rmSync(join(directory, 'source.txt'));
    mkdirSync(join(directory, 'source.txt'));
    await expect(readLocalEvidenceFixture(directory)).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});