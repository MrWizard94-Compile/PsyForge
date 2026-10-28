import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { request } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { PsyForgeService, type Clock } from './application/psyforge-service.js';
import type { LocalActorCredential } from './auth/local-credentials.js';
import { PsyForgeRepository } from './persistence/repository.js';
import { createPsyForgeHttpServer } from './transport/http-server.js';

const NOW = '2026-08-21T12:00:00.000Z';
const CLOCK: Clock = { now: () => NOW };
const TOKENS = {
  operator: 'a'.repeat(64),
  ingestor: 'b'.repeat(64),
  reviewer: 'c'.repeat(64),
  ethics_reviewer: 'd'.repeat(64),
  evidence_reviewer: 'e'.repeat(64),
} as const;
const CREDENTIALS: LocalActorCredential[] = Object.entries(TOKENS).map(([role, token]) => ({ token, actor: { id: `local-${role}`, role: role as LocalActorCredential['actor']['role'], tenantId: 'studio-alpha' } }));

function headers(role: keyof typeof TOKENS) {
  return { 'content-type': 'application/json', 'x-psyforge-api-token': TOKENS[role] };
}

function requestJson(baseUrl: string, pathname: string, method = 'GET', requestHeaders: Record<string, string> = {}, body?: unknown): Promise<{ status: number; body: unknown; headers: Record<string, string | string[] | undefined> }> {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const requestUrl = new URL(pathname, baseUrl);
    const client = request({ hostname: requestUrl.hostname, port: requestUrl.port, path: requestUrl.pathname, method, headers: payload === undefined ? requestHeaders : { ...requestHeaders, 'content-length': Buffer.byteLength(payload) } }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => {
        const responseText = Buffer.concat(chunks).toString('utf8');
        resolve({ status: response.statusCode ?? 0, body: responseText === '' ? undefined : JSON.parse(responseText), headers: response.headers });
      });
    });
    client.on('error', reject);
    if (payload !== undefined) {
      client.write(payload);
    }
    client.end();
  });
}

describe('PsyForge local HTTP boundary', () => {
  const directories: string[] = [];

  afterEach(() => {
    while (directories.length > 0) {
      rmSync(directories.pop()!, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    }
  });

  it('binds a credential to one role, accepts consented telemetry, and revokes approved evidence', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'psyforge-http-test-'));
    directories.push(directory);
    const repository = new PsyForgeRepository(join(directory, 'psyforge.sqlite'));
    const server = createPsyForgeHttpServer({ service: new PsyForgeService(repository, CLOCK), actorCredentials: CREDENTIALS });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;
    try {
      expect((await requestJson(baseUrl, '/health')).status).toBe(200);
      expect((await requestJson(baseUrl, '/v1/events', 'POST', { 'content-type': 'application/json' }, {})).status).toBe(401);
      const consent = { tenantId: 'studio-alpha', subjectId: 'player-001', purpose: 'behavioral_analysis', policyVersion: 'consent-v1', grantedAt: '2026-08-01T00:00:00.000Z', expiresAt: '2026-09-01T00:00:00.000Z' };
      expect((await requestJson(baseUrl, '/v1/consents', 'POST', headers('operator'), consent)).status).toBe(201);
      const telemetry = { schemaVersion: '1.0', eventId: randomUUID(), tenantId: 'studio-alpha', subjectId: 'player-001', purpose: 'behavioral_analysis', eventType: 'session.ended', occurredAt: '2026-08-20T12:00:00.000Z', payload: { sessionId: 'session-001', durationSeconds: 900 } };
      const response = await requestJson(baseUrl, '/v1/events', 'POST', headers('ingestor'), telemetry);
      expect(response.status).toBe(202);
      expect((response.body as { status: string }).status).toBe('accepted');
      expect((await requestJson(baseUrl, '/v1/features/recompute', 'POST', headers('operator'), { subjectId: 'player-001', windowEnd: '2026-02-30T12:00:00.000Z' })).status).toBe(400);
      expect((await requestJson(baseUrl, '/v1/events', 'POST', { ...headers('ingestor'), 'content-type': 'text/plain' }, telemetry)).status).toBe(415);
      const evidence = { tenantId: 'studio-alpha', sourceKey: 'synthetic-http-fixture', version: 'v1', title: 'Synthetic HTTP Fixture', stableCitation: 'internal:synthetic-http-fixture:v1', publisher: 'PsyForge test fixture', publishedAt: '2026-08-21T00:00:00.000Z', domain: 'synthetic_test', licenseBasis: 'synthetic', rightsReference: 'P5 synthetic test-data authorization', content: 'Synthetic source content must be hashed but never stored.' };
      const registeredEvidence = await requestJson(baseUrl, '/v1/evidence/sources', 'POST', headers('operator'), evidence);
      expect(registeredEvidence.status).toBe(201);
      const evidenceSourceId = (registeredEvidence.body as { source: { sourceId: string; contentSha256: string } }).source.sourceId;
      expect((registeredEvidence.body as { source: { contentSha256: string } }).source.contentSha256).toMatch(/^[0-9a-f]{64}$/);
      expect((await requestJson(baseUrl, `/v1/evidence/sources/${evidenceSourceId}/reviews`, 'POST', headers('evidence_reviewer'), { decision: 'approved', rationale: 'The fixture is bounded, rights-labelled, and suitable for local contract verification.' })).status).toBe(200);
      const graphAssertion = { tenantId: 'studio-alpha', evidenceSourceId, sourceNode: { key: 'loss-aversion', label: 'Loss aversion', type: 'corpus_concept' }, targetNode: { key: 'motivation-theory', label: 'Motivation theory', type: 'domain_entity' }, edgeType: 'belongs_to', epistemicTier: 'observed' };
      const createdGraph = await requestJson(baseUrl, '/v1/graph/assertions', 'POST', headers('operator'), graphAssertion);
      expect(createdGraph.status).toBe(201);
      expect((createdGraph.body as { assertion: { evidenceContentSha256: string } }).assertion.evidenceContentSha256).toMatch(/^[0-9a-f]{64}$/);
      expect((await requestJson(baseUrl, '/v1/graph/assertions', 'GET', headers('evidence_reviewer'))).status).toBe(200);      const forgedEvidenceRole = { ...headers('operator'), 'x-psyforge-role': 'evidence_reviewer', 'x-psyforge-actor-id': 'local-evidence_reviewer', 'x-psyforge-tenant-id': 'studio-alpha' };
      expect((await requestJson(baseUrl, `/v1/evidence/sources/${evidenceSourceId}/revoke`, 'POST', forgedEvidenceRole, { rationale: 'Forged role headers must not elevate the operator token.' })).status).toBe(403);
      expect((await requestJson(baseUrl, `/v1/evidence/sources/${evidenceSourceId}/revoke`, 'POST', headers('evidence_reviewer'), { rationale: 'The source rights basis was withdrawn.', unsupported: true })).status).toBe(400);
      const revoked = await requestJson(baseUrl, `/v1/evidence/sources/${evidenceSourceId}/revoke`, 'POST', headers('evidence_reviewer'), { rationale: 'The source rights basis was withdrawn for this local verification record.' });
      expect(revoked.status).toBe(200);
      expect((revoked.body as { source: { status: string } }).source.status).toBe('revoked');
      const invalidatedGraph = await requestJson(baseUrl, '/v1/graph/assertions', 'GET', headers('operator'));
      expect((invalidatedGraph.body as { assertions: Array<{ evidenceStatus: string; invalidatedAt?: string }> }).assertions).toEqual([expect.objectContaining({ evidenceStatus: 'revoked', invalidatedAt: NOW })]);
      expect((await requestJson(baseUrl, `/v1/evidence/sources/${evidenceSourceId}/revoke`, 'POST', headers('evidence_reviewer'), { rationale: 'A revoked source must not receive another terminal revocation.' })).status).toBe(409);
      const listedEvidence = await requestJson(baseUrl, '/v1/evidence/sources', 'GET', headers('evidence_reviewer'));
      expect((listedEvidence.body as { sources: Array<{ status: string }> }).sources).toEqual([expect.objectContaining({ status: 'revoked' })]);
      expect((await requestJson(baseUrl, '/v1/consents/revoke', 'POST', headers('operator'), { subjectId: 'player-001', unsupported: true })).status).toBe(400);
      expect((await requestJson(baseUrl, '/v1/consents/revoke', 'POST', headers('operator'), { subjectId: 'player-001' })).status).toBe(200);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error === undefined ? resolve() : reject(error)));
      repository.close();
    }
  });

  it('creates a bounded local session and accepts its cookie without re-sending a credential', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'psyforge-http-test-'));
    directories.push(directory);
    const repository = new PsyForgeRepository(join(directory, 'psyforge.sqlite'));
    const server = createPsyForgeHttpServer({ service: new PsyForgeService(repository, CLOCK), actorCredentials: CREDENTIALS });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;
    try {
      const created = await requestJson(baseUrl, '/v1/session', 'POST', headers('operator'));
      expect(created.status).toBe(201);
      expect((created.body as { actor: { id: string; role: string } }).actor).toEqual({ id: 'local-operator', role: 'operator', tenantId: 'studio-alpha' });
      const setCookie = created.headers['set-cookie'];
      const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      expect(cookie).toMatch(/^psyforge_session=/);
      expect((await requestJson(baseUrl, '/v1/audit', 'GET', { cookie: cookie!.split(';')[0] })).status).toBe(200);
      expect((await requestJson(baseUrl, '/v1/session', 'DELETE', { cookie: cookie!.split(';')[0] })).status).toBe(204);
      expect((await requestJson(baseUrl, '/v1/audit', 'GET', { cookie: cookie!.split(';')[0] })).status).toBe(401);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error === undefined ? resolve() : reject(error)));
      repository.close();
    }
  });
});