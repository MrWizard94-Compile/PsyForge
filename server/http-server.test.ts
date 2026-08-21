import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { request } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { PsyForgeService, type Clock } from './application/psyforge-service.js';
import { PsyForgeRepository } from './persistence/repository.js';
import { createPsyForgeHttpServer } from './transport/http-server.js';

const TOKEN = 'a'.repeat(64);
const NOW = '2026-08-21T12:00:00.000Z';
const CLOCK: Clock = { now: () => NOW };

function headers(role: string) {
  return { 'content-type': 'application/json', 'x-psyforge-api-token': TOKEN, 'x-psyforge-actor-id': `${role}-1`, 'x-psyforge-role': role, 'x-psyforge-tenant-id': 'studio-alpha' };
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

  it('binds a token-protected local contract and accepts only consented telemetry', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'psyforge-http-test-'));
    directories.push(directory);
    const repository = new PsyForgeRepository(join(directory, 'psyforge.sqlite'));
    const server = createPsyForgeHttpServer({ service: new PsyForgeService(repository, CLOCK), localToken: TOKEN });
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
      expect((await requestJson(baseUrl, '/v1/events', 'POST', { ...headers('ingestor'), 'content-type': 'text/plain' }, telemetry)).status).toBe(415);
      expect((await requestJson(baseUrl, '/v1/consents/revoke', 'POST', headers('operator'), { subjectId: 'player-001', unsupported: true })).status).toBe(400);
      expect((await requestJson(baseUrl, '/v1/consents/revoke', 'POST', headers('operator'), { subjectId: 'player-001' })).status).toBe(200);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error === undefined ? resolve() : reject(error)));
      repository.close();
    }
  });

  it('creates a bounded local session and accepts its cookie without re-sending the token', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'psyforge-http-test-'));
    directories.push(directory);
    const repository = new PsyForgeRepository(join(directory, 'psyforge.sqlite'));
    const server = createPsyForgeHttpServer({ service: new PsyForgeService(repository, CLOCK), localToken: TOKEN });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;
    try {
      const created = await requestJson(baseUrl, '/v1/session', 'POST', headers('operator'));
      expect(created.status).toBe(201);
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
