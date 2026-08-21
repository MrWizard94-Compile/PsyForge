import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { DomainError, type Actor, type ActorRole, type ReviewDecision } from '../domain/types.js';
import { PsyForgeService } from '../application/psyforge-service.js';

const MAX_BODY_BYTES = 64 * 1024;
const ROLES = new Set<ActorRole>(['operator', 'ingestor', 'reviewer', 'ethics_reviewer']);
const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

export interface HttpServerOptions {
  service: PsyForgeService;
  localToken: string;
  staticDirectory?: string;
}

const SESSION_COOKIE = 'psyforge_session';
const STATIC_CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
};

function sendJson(response: ServerResponse, statusCode: number, body: unknown, correlationId: string, headers: Record<string, string> = {}): void {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'x-correlation-id': correlationId, ...headers });
  response.end(JSON.stringify(body));
}

function readCookie(request: IncomingMessage, name: string): string | undefined {
  const cookie = request.headers.cookie;
  if (cookie === undefined) {
    return undefined;
  }
  return cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function actorFromTokenHeaders(request: IncomingMessage, token: string): Actor {
  if (request.headers['x-psyforge-api-token'] !== token) {
    throw new DomainError('UNAUTHENTICATED', 'A valid local API token is required.', 401);
  }
  const id = request.headers['x-psyforge-actor-id'];
  const role = request.headers['x-psyforge-role'];
  const tenantId = request.headers['x-psyforge-tenant-id'];
  if (typeof id !== 'string' || typeof role !== 'string' || typeof tenantId !== 'string' || !IDENTIFIER_PATTERN.test(id) || !IDENTIFIER_PATTERN.test(tenantId) || !ROLES.has(role as ActorRole)) {
    throw new DomainError('UNAUTHENTICATED', 'Actor headers are incomplete or invalid.', 401);
  }
  return { id, role: role as ActorRole, tenantId };
}

function exactRecord(input: unknown, keys: readonly string[], description: string): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new DomainError('VALIDATION_FAILED', `${description} must be an object.`, 400);
  }
  const record = input as Record<string, unknown>;
  const actual = Object.keys(record).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new DomainError('VALIDATION_FAILED', `${description} contains missing or unsupported fields.`, 400);
  }
  return record;
}

function subjectCommand(input: unknown): { subjectId: string; windowEnd?: string } {
  const hasWindowEnd = typeof input === 'object' && input !== null && !Array.isArray(input) && Object.prototype.hasOwnProperty.call(input, 'windowEnd');
  const record = exactRecord(input, hasWindowEnd ? ['subjectId', 'windowEnd'] : ['subjectId'], 'command body');
  if (typeof record.subjectId !== 'string' || !IDENTIFIER_PATTERN.test(record.subjectId) || (record.windowEnd !== undefined && (typeof record.windowEnd !== 'string' || Number.isNaN(Date.parse(record.windowEnd))))) {
    throw new DomainError('VALIDATION_FAILED', 'subjectId and optional windowEnd are required in the expected format.', 400);
  }
  return { subjectId: record.subjectId, windowEnd: record.windowEnd === undefined ? undefined : new Date(record.windowEnd).toISOString() };
}

function actorFromRequest(request: IncomingMessage, token: string, sessions: Map<string, { actor: Actor; expiresAt: number }>): Actor {
  const sessionId = readCookie(request, SESSION_COOKIE);
  const session = sessionId === undefined ? undefined : sessions.get(sessionId);
  if (session !== undefined && session.expiresAt > Date.now()) {
    return session.actor;
  }
  if (sessionId !== undefined) {
    sessions.delete(sessionId);
  }
  return actorFromTokenHeaders(request, token);
}

async function parseJsonBody(request: IncomingMessage): Promise<unknown> {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') {
    throw new DomainError('VALIDATION_FAILED', 'Content-Type must be application/json.', 415);
  }
  let total = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_BODY_BYTES) {
      throw new DomainError('VALIDATION_FAILED', 'Request body exceeds 65536 bytes.', 413);
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new DomainError('VALIDATION_FAILED', 'Request body must contain valid JSON.', 400);
  }
}

function matchRecommendationDecision(pathname: string): string | undefined {
  const match = /^\/v1\/recommendations\/([0-9a-f-]{36})\/decisions$/i.exec(pathname);
  return match?.[1];
}

function matchRecommendation(pathname: string): string | undefined {
  const match = /^\/v1\/recommendations\/([0-9a-f-]{36})$/i.exec(pathname);
  return match?.[1];
}

export function createPsyForgeHttpServer(options: HttpServerOptions): Server {
  const sessions = new Map<string, { actor: Actor; expiresAt: number }>();
  const staticDirectory = options.staticDirectory === undefined ? undefined : resolve(options.staticDirectory);
  return createServer(async (request, response) => {
    const correlationId = randomUUID();
    try {
      const method = request.method ?? 'GET';
      const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
      if (method === 'GET' && pathname === '/health') {
        sendJson(response, 200, { status: 'ok', service: 'psyforge-local', version: '0.1.0' }, correlationId);
        return;
      }
      if (method === 'GET' && staticDirectory !== undefined && !pathname.startsWith('/v1/')) {
        await serveStatic(response, pathname, staticDirectory);
        return;
      }
      if (method === 'POST' && pathname === '/v1/session') {
        const actor = actorFromTokenHeaders(request, options.localToken);
        const sessionId = randomUUID();
        sessions.set(sessionId, { actor, expiresAt: Date.now() + 28_800_000 });
        sendJson(response, 201, { session: 'created', actor: { id: actor.id, role: actor.role, tenantId: actor.tenantId } }, correlationId, { 'set-cookie': `${SESSION_COOKIE}=${sessionId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800` });
        return;
      }
      if (method === 'DELETE' && pathname === '/v1/session') {
        const sessionId = readCookie(request, SESSION_COOKIE);
        if (sessionId !== undefined) {
          sessions.delete(sessionId);
        }
        sendJson(response, 204, undefined, correlationId, { 'set-cookie': `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` });
        return;
      }
      const actor = actorFromRequest(request, options.localToken, sessions);
      if (method === 'POST' && pathname === '/v1/consents') {
        sendJson(response, 201, { consent: options.service.grantConsent(actor, await parseJsonBody(request)) }, correlationId);
        return;
      }
      if (method === 'POST' && pathname === '/v1/consents/revoke') {
        const body = subjectCommand(await parseJsonBody(request));
        if (body.windowEnd !== undefined) {
          throw new DomainError('VALIDATION_FAILED', 'Consent revocation accepts subjectId only.', 400);
        }
        sendJson(response, 200, { revoked: options.service.revokeConsent(actor, body.subjectId) }, correlationId);
        return;
      }
      if (method === 'POST' && pathname === '/v1/events') {
        sendJson(response, 202, options.service.ingest(actor, await parseJsonBody(request)), correlationId);
        return;
      }
      if (method === 'POST' && pathname === '/v1/features/recompute') {
        const body = subjectCommand(await parseJsonBody(request));
        sendJson(response, 200, { features: options.service.recomputeFeatures(actor, body.subjectId, body.windowEnd) }, correlationId);
        return;
      }
      if (method === 'POST' && pathname === '/v1/models/baseline') {
        const body = subjectCommand(await parseJsonBody(request));
        sendJson(response, 201, { model: options.service.buildBaselineModel(actor, body.subjectId, body.windowEnd) }, correlationId);
        return;
      }
      if (method === 'POST' && pathname === '/v1/recommendations') {
        const body = exactRecord(await parseJsonBody(request), ['modelResultId'], 'recommendation body');
        if (typeof body.modelResultId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.modelResultId)) {
          throw new DomainError('VALIDATION_FAILED', 'modelResultId is required.', 400);
        }
        sendJson(response, 201, { recommendation: options.service.createRecommendation(actor, body.modelResultId) }, correlationId);
        return;
      }
      const decisionRecommendationId = matchRecommendationDecision(pathname);
      if (method === 'POST' && decisionRecommendationId !== undefined) {
        const body = exactRecord(await parseJsonBody(request), ['decision', 'rationale'], 'decision body');
        const decisions: ReviewDecision['decision'][] = ['approved', 'rejected', 'modified', 'vetoed'];
        if (typeof body.rationale !== 'string' || !decisions.includes(body.decision as ReviewDecision['decision'])) {
          throw new DomainError('VALIDATION_FAILED', 'decision and rationale are required.', 400);
        }
        sendJson(response, 200, { recommendation: options.service.decideRecommendation(actor, decisionRecommendationId, body.decision as ReviewDecision['decision'], body.rationale) }, correlationId);
        return;
      }
      const recommendationId = matchRecommendation(pathname);
      if (method === 'GET' && recommendationId !== undefined) {
        sendJson(response, 200, { recommendation: options.service.getRecommendation(actor, recommendationId) }, correlationId);
        return;
      }
      if (method === 'GET' && pathname === '/v1/audit') {
        sendJson(response, 200, { auditEvents: options.service.listAudit(actor) }, correlationId);
        return;
      }
      throw new DomainError('NOT_FOUND', 'Route was not found.', 404);
    } catch (error) {
      const domainError = error instanceof DomainError ? error : new DomainError('INTERNAL_ERROR', 'The local service could not complete the request.', 500);
      sendJson(response, domainError.statusCode, { error: { code: domainError.code, message: domainError.message } }, correlationId);
    }
  });
}

async function serveStatic(response: ServerResponse, pathname: string, staticDirectory: string): Promise<void> {
  const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const requestedFile = resolve(staticDirectory, requestedPath);
  const safePrefix = `${staticDirectory}${sep}`;
  if (requestedFile !== staticDirectory && !requestedFile.startsWith(safePrefix)) {
    throw new DomainError('NOT_FOUND', 'Static resource was not found.', 404);
  }
  const fallbackFile = resolve(staticDirectory, 'index.html');
  let servedFile = requestedFile;
  let content: Buffer;
  try {
    content = await readFile(servedFile);
  } catch {
    if (extname(requestedFile) !== '') {
      throw new DomainError('NOT_FOUND', 'Static resource was not found.', 404);
    }
    servedFile = fallbackFile;
    try {
      content = await readFile(servedFile);
    } catch {
      throw new DomainError('NOT_FOUND', 'The dashboard build is not available. Run npm run build first.', 404);
    }
  }
  response.writeHead(200, { 'content-type': STATIC_CONTENT_TYPES[extname(servedFile)] ?? 'application/octet-stream', 'cache-control': extname(servedFile) === '.html' ? 'no-store' : 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' });
  response.end(content);
}
