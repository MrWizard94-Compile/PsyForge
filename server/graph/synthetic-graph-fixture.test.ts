import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PsyForgeService, type Clock } from '../application/psyforge-service.js';
import type { Actor } from '../domain/types.js';
import { PsyForgeRepository } from '../persistence/repository.js';
import { parseGraphFixtureArguments, runGraphFixture } from './fixture-cli.js';
import { readSyntheticGraphFixture, serializeSyntheticGraphFixture } from './synthetic-graph-fixture.js';

const CLOCK: Clock = { now: () => '2026-08-21T12:00:00.000Z' };
const OPERATOR: Actor = { id: 'operator-1', role: 'operator', tenantId: 'studio-alpha' };
const REVIEWER: Actor = { id: 'reviewer-1', role: 'evidence_reviewer', tenantId: 'studio-alpha' };
const directories: string[] = [];

function directory(): string {
  const value = mkdtempSync(join(tmpdir(), 'psyforge-graph-fixture-'));
  directories.push(value);
  return value;
}

function initializeApprovedSyntheticSource(dataDirectory: string): string {
  const repository = new PsyForgeRepository(join(dataDirectory, 'psyforge.sqlite'));
  try {
    const service = new PsyForgeService(repository, CLOCK);
    const source = service.registerEvidenceSource(OPERATOR, {
      tenantId: 'studio-alpha', sourceKey: 'graph-fixture-source', version: 'v1', title: 'Graph fixture source', stableCitation: 'internal:graph-fixture-source:v1',
      publisher: 'PsyForge test fixture', publishedAt: '2026-08-21T00:00:00.000Z', domain: 'synthetic_test', licenseBasis: 'synthetic',
      rightsReference: 'Synthetic graph fixture verification source.', content: 'Synthetic graph fixture source text is never persisted.',
    });
    service.reviewEvidenceSource(REVIEWER, source.sourceId, 'approved', 'Synthetic fixture provenance is approved for local P6 graph fixture verification.');
    return source.sourceId;
  } finally {
    repository.close();
  }
}

function fixture(sourceId: string) {
  return {
    schemaVersion: '1.0', tenantId: 'studio-alpha', assertions: [{
      evidenceSourceId: sourceId, sourceNode: { key: 'loss-aversion', label: 'Loss aversion', type: 'corpus_concept' },
      targetNode: { key: 'motivation-theory', label: 'Motivation theory', type: 'domain_entity' }, edgeType: 'belongs_to', epistemicTier: 'observed',
    }],
  };
}

describe('P6 synthetic graph fixtures', () => {
  afterEach(() => {
    while (directories.length > 0) {
      rmSync(directories.pop()!, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    }
  });

  it('imports a real bounded fixture and exports byte-stable active assertions without overwrite', async () => {
    const dataDirectory = directory();
    const sourceId = initializeApprovedSyntheticSource(dataDirectory);
    const fixturePath = join(dataDirectory, 'fixture.json');
    writeFileSync(fixturePath, JSON.stringify(fixture(sourceId)), 'utf8');
    const parsed = parseGraphFixtureArguments(['--mode', 'import', '--data-dir', dataDirectory, '--tenant-id', 'studio-alpha', '--fixture', fixturePath]);
    expect(await runGraphFixture(parsed)).toMatchObject({ mode: 'import', assertionCount: 1 });
    const exportPath = join(dataDirectory, 'export.json');
    const exported = await runGraphFixture({ ...parsed, mode: 'export', fixturePath: exportPath });
    expect(exported).toMatchObject({ mode: 'export', assertionCount: 1 });
    const first = readFileSync(exportPath, 'utf8');
    const roundTrip = await readSyntheticGraphFixture(exportPath);
    expect(roundTrip.assertions).toHaveLength(1);
    const repository = new PsyForgeRepository(join(dataDirectory, 'psyforge.sqlite'));
    try {
      const stable = serializeSyntheticGraphFixture('studio-alpha', new PsyForgeService(repository, CLOCK).listGraphAssertions(OPERATOR));
      expect(stable).toBe(first);
    } finally {
      repository.close();
    }
    await expect(runGraphFixture({ ...parsed, mode: 'export', fixturePath: exportPath })).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('rejects malformed fixtures before they can create graph state', async () => {
    const dataDirectory = directory();
    const sourceId = initializeApprovedSyntheticSource(dataDirectory);
    const fixturePath = join(dataDirectory, 'invalid.json');
    writeFileSync(fixturePath, JSON.stringify({ ...fixture(sourceId), unapproved: true }), 'utf8');
    await expect(readSyntheticGraphFixture(fixturePath)).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(() => parseGraphFixtureArguments(['--mode', 'import', '--data-dir', dataDirectory, '--tenant-id', 'studio-alpha'])).toThrow(/Usage/);
  });
});