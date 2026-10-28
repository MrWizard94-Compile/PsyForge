import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PsyForgeService, type Clock } from './application/psyforge-service.js';
import type { Actor, EvidenceSource } from './domain/types.js';
import { PsyForgeRepository } from './persistence/repository.js';

const CLOCK: Clock = { now: () => '2026-08-21T12:00:00.000Z' };
const OPERATOR: Actor = { id: 'operator-1', role: 'operator', tenantId: 'studio-alpha' };
const EVIDENCE_REVIEWER: Actor = { id: 'evidence-reviewer-1', role: 'evidence_reviewer', tenantId: 'studio-alpha' };
const directories: string[] = [];

function evidenceInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 'studio-alpha', sourceKey: 'synthetic-p6-fixture', version: 'v1', title: 'Synthetic P6 Fixture', stableCitation: 'internal:synthetic-p6-fixture:v1',
    publisher: 'PsyForge test fixture', publishedAt: '2026-08-21T00:00:00.000Z', domain: 'synthetic_test', licenseBasis: 'synthetic',
    rightsReference: 'Synthetic P6 graph-kernel verification source.', content: 'This source is hashed and never stored by the local registry.', ...overrides,
  };
}

function assertionInput(sourceId: string, overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 'studio-alpha', evidenceSourceId: sourceId,
    sourceNode: { key: 'loss-aversion', label: 'Loss aversion', type: 'corpus_concept' },
    targetNode: { key: 'motivation-theory', label: 'Motivation theory', type: 'domain_entity' },
    edgeType: 'belongs_to', epistemicTier: 'observed', ...overrides,
  };
}

function approvedEvidence(service: PsyForgeService): EvidenceSource {
  const source = service.registerEvidenceSource(OPERATOR, evidenceInput());
  return service.reviewEvidenceSource(EVIDENCE_REVIEWER, source.sourceId, 'approved', 'Synthetic fixture provenance and rights are sufficient for P6 contract verification.');
}

function createRuntime() {
  const directory = mkdtempSync(join(tmpdir(), 'psyforge-graph-'));
  directories.push(directory);
  const databasePath = join(directory, 'psyforge.sqlite');
  const repository = new PsyForgeRepository(databasePath);
  return { repository, databasePath, service: new PsyForgeService(repository, CLOCK) };
}

describe('P6 synthetic graph kernel', () => {
  afterEach(() => {
    while (directories.length > 0) {
      rmSync(directories.pop()!, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    }
  });

  it('persists reconstructible structural provenance without raw source content', () => {
    const runtime = createRuntime();
    try {
      const source = approvedEvidence(runtime.service);
      const assertion = runtime.service.createGraphAssertion(OPERATOR, assertionInput(source.sourceId));
      expect(assertion).toMatchObject({ edgeType: 'belongs_to', epistemicTier: 'observed', authorRole: 'operator', confidence: 1, evidenceSourceId: source.sourceId, evidenceContentSha256: source.contentSha256, evidenceStatus: 'approved' });
      expect(assertion.sourceNode.type).toBe('corpus_concept');
      expect(assertion.targetNode.type).toBe('domain_entity');
      expect(JSON.stringify(assertion)).not.toContain('This source is hashed');
      expect(runtime.service.listGraphAssertions(OPERATOR)).toEqual([expect.objectContaining({ assertionId: assertion.assertionId, invalidatedAt: undefined })]);
      expect(() => runtime.service.createGraphAssertion(OPERATOR, assertionInput(source.sourceId))).toThrow(/already registered/);
      expect(() => runtime.service.createGraphAssertion(OPERATOR, assertionInput(source.sourceId, { edgeType: 'causes' }))).toThrow(/belongs_to/);
      expect(() => runtime.service.createGraphAssertion(OPERATOR, assertionInput(source.sourceId, { epistemicTier: 'inferred' }))).toThrow(/does not perform inference/);
    } finally {
      runtime.repository.close();
    }
  });

  it('fails closed for foreign, pending, non-synthetic, and cross-tenant provenance', () => {
    const runtime = createRuntime();
    try {
      const pending = runtime.service.registerEvidenceSource(OPERATOR, evidenceInput({ sourceKey: 'pending-p6-fixture' }));
      expect(() => runtime.service.createGraphAssertion(OPERATOR, assertionInput(pending.sourceId))).toThrow(/approved, non-revoked/);
      const nonSynthetic = runtime.service.registerEvidenceSource(OPERATOR, evidenceInput({ sourceKey: 'licensed-p6-fixture', licenseBasis: 'public_domain', domain: 'game_design' }));
      runtime.service.reviewEvidenceSource(EVIDENCE_REVIEWER, nonSynthetic.sourceId, 'approved', 'The test source is approved only to verify that P6 synthetic-only enforcement rejects it.');
      expect(() => runtime.service.createGraphAssertion(OPERATOR, assertionInput(nonSynthetic.sourceId))).toThrow(/synthetic evidence sources only/);
      const approved = approvedEvidence(runtime.service);
      expect(() => runtime.service.createGraphAssertion(OPERATOR, assertionInput(approved.sourceId, { tenantId: 'studio-bravo' }))).toThrow(/tenant/);
    } finally {
      runtime.repository.close();
    }
  });

  it('rolls batch failures back, persists immutably, and invalidates assertions on source revocation', () => {
    const runtime = createRuntime();
    try {
      const source = approvedEvidence(runtime.service);
      expect(() => runtime.service.createGraphAssertions(OPERATOR, [assertionInput(source.sourceId), assertionInput(source.sourceId)])).toThrow(/already registered/);
      expect(runtime.service.listGraphAssertions(OPERATOR)).toEqual([]);
      const assertion = runtime.service.createGraphAssertion(OPERATOR, assertionInput(source.sourceId));
      runtime.service.revokeEvidenceSource(EVIDENCE_REVIEWER, source.sourceId, 'Synthetic source rights are withdrawn to verify deterministic P6 downstream invalidation.');
      const invalidated = runtime.service.listGraphAssertions(OPERATOR);
      expect(invalidated).toEqual([expect.objectContaining({ assertionId: assertion.assertionId, evidenceStatus: 'revoked', invalidatedAt: '2026-08-21T12:00:00.000Z' })]);
      expect(() => runtime.service.createGraphAssertion(OPERATOR, assertionInput(source.sourceId, { sourceNode: { key: 'other-concept', label: 'Other concept', type: 'corpus_concept' } }))).toThrow(/approved, non-revoked/);
    } finally {
      runtime.repository.close();
    }
    const database = new Database(runtime.databasePath);
    try {
      expect(() => database.prepare("UPDATE graph_assertions SET edge_type = 'belongs_to'").run()).toThrow(/immutable/);
      expect(() => database.prepare('DELETE FROM graph_assertion_invalidations').run()).toThrow(/immutable/);
    } finally {
      database.close();
    }
  });
});