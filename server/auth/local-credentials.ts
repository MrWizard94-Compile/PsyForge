import type { Actor, ActorRole } from '../domain/types.js';

export const LOCAL_CREDENTIAL_SCHEMA_VERSION = '1.0' as const;
export const LOCAL_CREDENTIAL_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const ACTOR_ROLES = new Set<ActorRole>(['operator', 'ingestor', 'reviewer', 'ethics_reviewer', 'evidence_reviewer']);

export interface LocalActorCredential {
  token: string;
  actor: Actor;
}

interface LocalCredentialFile {
  schemaVersion: typeof LOCAL_CREDENTIAL_SCHEMA_VERSION;
  actors: Array<Actor & { token: string }>;
}

function configurationError(message: string): Error {
  return new Error(`Invalid PsyForge local credential configuration: ${message}`);
}

function assertExactObject(value: unknown, keys: readonly string[], description: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw configurationError(`${description} must be an object.`);
  }
  const record = value as Record<string, unknown>;
  const actualKeys = Object.keys(record).sort();
  const expectedKeys = [...keys].sort();
  if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) {
    throw configurationError(`${description} contains missing or unsupported fields.`);
  }
  return record;
}

/**
 * Validates the private local credential set before the HTTP server begins.
 * A token is bound to precisely one actor identity, tenant, and role. This is
 * a local role boundary, not a replacement for an enterprise identity system.
 */
export function validateLocalActorCredentials(credentials: readonly LocalActorCredential[]): void {
  if (credentials.length === 0) {
    throw configurationError('at least one actor credential is required.');
  }
  const tokens = new Set<string>();
  const actorIds = new Set<string>();
  for (const credential of credentials) {
    if (!LOCAL_CREDENTIAL_TOKEN_PATTERN.test(credential.token)) {
      throw configurationError('every actor token must be a 64-character hexadecimal value.');
    }
    if (!IDENTIFIER_PATTERN.test(credential.actor.id) || !IDENTIFIER_PATTERN.test(credential.actor.tenantId) || !ACTOR_ROLES.has(credential.actor.role)) {
      throw configurationError('every actor must have valid opaque id, tenantId, and role values.');
    }
    if (tokens.has(credential.token)) {
      throw configurationError('actor tokens must be unique.');
    }
    if (actorIds.has(credential.actor.id)) {
      throw configurationError('actor ids must be unique across local credentials.');
    }
    tokens.add(credential.token);
    actorIds.add(credential.actor.id);
  }
}

/** Parses the fixed, secret-bearing runtime file without accepting extra fields. */
export function parseLocalActorCredentialsFile(serialized: string): LocalActorCredential[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw configurationError('the credential file must contain valid JSON.');
  }
  const root = assertExactObject(parsed, ['schemaVersion', 'actors'], 'credential file');
  if (root.schemaVersion !== LOCAL_CREDENTIAL_SCHEMA_VERSION || !Array.isArray(root.actors)) {
    throw configurationError(`schemaVersion must be ${LOCAL_CREDENTIAL_SCHEMA_VERSION} and actors must be an array.`);
  }
  const credentials = root.actors.map((entry, index) => {
    const record = assertExactObject(entry, ['id', 'role', 'tenantId', 'token'], `actors[${index}]`);
    if (typeof record.id !== 'string' || typeof record.role !== 'string' || typeof record.tenantId !== 'string' || typeof record.token !== 'string') {
      throw configurationError(`actors[${index}] fields must be strings.`);
    }
    return { token: record.token, actor: { id: record.id, role: record.role as ActorRole, tenantId: record.tenantId } };
  });
  validateLocalActorCredentials(credentials);
  return credentials;
}

/** Serializes only the private runtime credential file; callers must never log this result. */
export function serializeLocalActorCredentialsFile(credentials: readonly LocalActorCredential[]): string {
  validateLocalActorCredentials(credentials);
  const file: LocalCredentialFile = {
    schemaVersion: LOCAL_CREDENTIAL_SCHEMA_VERSION,
    actors: credentials.map((credential) => ({ ...credential.actor, token: credential.token })),
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

/** Creates the minimal distinct local workflow identities for a first-run service. */
export function createInitialLocalActorCredentials(tokenFactory: () => string, tenantId = 'studio-alpha'): LocalActorCredential[] {
  if (!IDENTIFIER_PATTERN.test(tenantId)) {
    throw configurationError('the bootstrap tenantId must be an opaque identifier.');
  }
  const actors: Array<Omit<Actor, 'tenantId'>> = [
    { id: 'local-operator', role: 'operator' },
    { id: 'local-ingestor', role: 'ingestor' },
    { id: 'local-reviewer', role: 'reviewer' },
    { id: 'local-ethics-reviewer', role: 'ethics_reviewer' },
    { id: 'local-evidence-reviewer', role: 'evidence_reviewer' },
  ];
  const credentials = actors.map((actor) => ({ token: tokenFactory(), actor: { ...actor, tenantId } }));
  validateLocalActorCredentials(credentials);
  return credentials;
}