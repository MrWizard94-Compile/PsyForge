import { describe, expect, it } from 'vitest';
import { createInitialLocalActorCredentials, parseLocalActorCredentialsFile, serializeLocalActorCredentialsFile, validateLocalActorCredentials } from './local-credentials.js';

function token(character: string): string {
  return character.repeat(64);
}

describe('local actor credentials', () => {
  it('round-trips a strict, role-bound bootstrap credential file', () => {
    const values = ['a', 'b', 'c', 'd', 'e'];
    const credentials = createInitialLocalActorCredentials(() => token(values.shift()!));
    const parsed = parseLocalActorCredentialsFile(serializeLocalActorCredentialsFile(credentials));
    expect(parsed).toEqual(credentials);
    expect(parsed.map((credential) => credential.actor.role)).toEqual(['operator', 'ingestor', 'reviewer', 'ethics_reviewer', 'evidence_reviewer']);
    expect(new Set(parsed.map((credential) => credential.actor.id)).size).toBe(parsed.length);
  });

  it('rejects duplicate credentials, malformed actors, and unsupported file fields', () => {
    const valid = [{ token: token('a'), actor: { id: 'local-operator', role: 'operator' as const, tenantId: 'studio-alpha' } }];
    expect(() => validateLocalActorCredentials([...valid, { token: token('a'), actor: { id: 'local-reviewer', role: 'reviewer', tenantId: 'studio-alpha' } }])).toThrow(/tokens must be unique/);
    expect(() => validateLocalActorCredentials([{ token: token('b'), actor: { id: 'local-operator', role: 'operator', tenantId: 'studio-alpha' } }, { token: token('c'), actor: { id: 'local-operator', role: 'reviewer', tenantId: 'studio-alpha' } }])).toThrow(/actor ids must be unique/);
    expect(() => parseLocalActorCredentialsFile(JSON.stringify({ schemaVersion: '1.0', actors: [{ id: 'operator', role: 'operator', tenantId: 'studio-alpha', token: token('d'), ignored: true }] }))).toThrow(/unsupported fields/);
    expect(() => parseLocalActorCredentialsFile(JSON.stringify({ schemaVersion: '1.0', actors: [{ id: 'operator', role: 'not-a-role', tenantId: 'studio-alpha', token: token('e') }] }))).toThrow(/valid opaque id, tenantId, and role/);
  });
});