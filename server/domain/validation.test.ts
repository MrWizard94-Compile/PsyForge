import { describe, expect, it } from 'vitest';
import { parseConsentGrant, parseEvidenceSourceRegistration, parseTelemetryEvent } from './validation.js';

describe('P0–P5 timestamp boundaries', () => {
  it('rejects invalid timestamp forms for consent, telemetry, and evidence registration', () => {
    expect(() => parseConsentGrant({
      tenantId: 'studio-alpha', subjectId: 'player-001', purpose: 'behavioral_analysis', policyVersion: 'consent-v1',
      grantedAt: '2026-02-30T00:00:00.000Z', expiresAt: '2026-09-01T00:00:00.000Z',
    })).toThrow(/grantedAt/);
    expect(() => parseTelemetryEvent({
      schemaVersion: '1.0', eventId: '00000000-0000-4000-8000-000000000001', tenantId: 'studio-alpha', subjectId: 'player-001', purpose: 'behavioral_analysis',
      eventType: 'session.ended', occurredAt: '2026-08-21T12:00:00', payload: { sessionId: 'session-001', durationSeconds: 900 },
    })).toThrow(/occurredAt/);
    expect(() => parseEvidenceSourceRegistration({
      tenantId: 'studio-alpha', sourceKey: 'synthetic-fixture', version: 'v1', title: 'Synthetic fixture', stableCitation: 'internal:synthetic-fixture:v1',
      publisher: 'PsyForge fixture', publishedAt: '2026-08-21T12:00:00.0000Z', domain: 'synthetic_test', licenseBasis: 'synthetic',
      rightsReference: 'Synthetic verification source.', content: 'Hash this transient synthetic fixture without persisting its text.',
    })).toThrow(/publishedAt/);
  });

  it('normalizes accepted explicit-offset timestamps before domain use', () => {
    const consent = parseConsentGrant({
      tenantId: 'studio-alpha', subjectId: 'player-001', purpose: 'behavioral_analysis', policyVersion: 'consent-v1',
      grantedAt: '2026-08-01T01:00:00+01:00', expiresAt: '2026-09-01T01:00:00+01:00',
    });
    expect(consent.grantedAt).toBe('2026-08-01T00:00:00.000Z');
    expect(consent.expiresAt).toBe('2026-09-01T00:00:00.000Z');
  });
});