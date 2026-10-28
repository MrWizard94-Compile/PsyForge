import {
  type ActivityCompletedPayload,
  type Actor,
  type ConsentGrant,
  type EventType,
  type EvidenceDomain,
  type EvidenceLicenseBasis,
  type EvidenceSourceRegistration,
  EVENT_SCHEMA_VERSION,
  type Purpose,
  P0_PURPOSE,
  type SessionEndedPayload,
  type TelemetryEvent,
  type TelemetryEventBase,
  DomainError,
} from './types.js';
import { normalizeIso8601Timestamp } from './timestamps.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const ACTIVITY_TYPES = new Set(['exploration', 'combat', 'social', 'crafting']);
const EVIDENCE_DOMAINS = new Set<EvidenceDomain>(['game_psychology', 'behavioral_economics', 'motivation_theory', 'cognitive_science', 'game_design', 'social_dynamics', 'ux_research', 'marketing_science', 'education_psychology', 'decision_theory', 'synthetic_test']);
const EVIDENCE_LICENSE_BASES = new Set<EvidenceLicenseBasis>(['public_domain', 'cc_by_4_0', 'cc_by_sa_4_0', 'organization_owned', 'written_permission', 'synthetic']);
const MAX_EVIDENCE_CONTENT_BYTES = 48 * 1024;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireExactKeys(value: JsonRecord, keys: readonly string[], location: string): void {
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...keys].sort();
  if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) {
    throw new DomainError('VALIDATION_FAILED', `${location} contains missing or unsupported fields.`, 400);
  }
}

function requireIdentifier(value: unknown, name: string): string {
  if (typeof value !== 'string' || !IDENTIFIER_PATTERN.test(value)) {
    throw new DomainError('VALIDATION_FAILED', `${name} must be a 1–128 character opaque identifier.`, 400);
  }
  return value;
}

function requireUuid(value: unknown, name: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new DomainError('VALIDATION_FAILED', `${name} must be a UUID.`, 400);
  }
  return value;
}

function requireTimestamp(value: unknown, name: string): string {
  return normalizeIso8601Timestamp(value, name);
}

function requirePurpose(value: unknown): Purpose {
  if (value !== P0_PURPOSE) {
    throw new DomainError('PURPOSE_DENIED', 'The P0 slice permits only behavioral_analysis.', 403);
  }
  return P0_PURPOSE;
}

function parseSessionPayload(value: unknown): SessionEndedPayload {
  if (!isRecord(value)) {
    throw new DomainError('VALIDATION_FAILED', 'payload must be an object.', 400);
  }
  requireExactKeys(value, ['durationSeconds', 'sessionId'], 'session.ended payload');
  const durationSeconds = value.durationSeconds;
  if (typeof durationSeconds !== 'number' || !Number.isInteger(durationSeconds) || durationSeconds < 0 || durationSeconds > 43_200) {
    throw new DomainError('VALIDATION_FAILED', 'durationSeconds must be an integer between 0 and 43200.', 400);
  }
  return { sessionId: requireIdentifier(value.sessionId, 'sessionId'), durationSeconds };
}

function parseActivityPayload(value: unknown): ActivityCompletedPayload {
  if (!isRecord(value)) {
    throw new DomainError('VALIDATION_FAILED', 'payload must be an object.', 400);
  }
  requireExactKeys(value, ['activityType'], 'activity.completed payload');
  if (typeof value.activityType !== 'string' || !ACTIVITY_TYPES.has(value.activityType)) {
    throw new DomainError('VALIDATION_FAILED', 'activityType is not supported by P0.', 400);
  }
  return { activityType: value.activityType as ActivityCompletedPayload['activityType'] };
}

export function parseConsentGrant(input: unknown): ConsentGrant {
  if (!isRecord(input)) {
    throw new DomainError('VALIDATION_FAILED', 'Consent grant must be an object.', 400);
  }
  requireExactKeys(input, ['expiresAt', 'grantedAt', 'policyVersion', 'purpose', 'subjectId', 'tenantId'], 'consent grant');
  const grantedAt = requireTimestamp(input.grantedAt, 'grantedAt');
  const expiresAt = requireTimestamp(input.expiresAt, 'expiresAt');
  if (Date.parse(expiresAt) <= Date.parse(grantedAt)) {
    throw new DomainError('VALIDATION_FAILED', 'expiresAt must be after grantedAt.', 400);
  }
  return {
    tenantId: requireIdentifier(input.tenantId, 'tenantId'),
    subjectId: requireIdentifier(input.subjectId, 'subjectId'),
    purpose: requirePurpose(input.purpose),
    policyVersion: requireIdentifier(input.policyVersion, 'policyVersion'),
    grantedAt,
    expiresAt,
  };
}

export function parseTelemetryEvent(input: unknown): TelemetryEvent {
  if (!isRecord(input)) {
    throw new DomainError('VALIDATION_FAILED', 'Telemetry event must be an object.', 400);
  }
  requireExactKeys(input, ['eventId', 'eventType', 'occurredAt', 'payload', 'purpose', 'schemaVersion', 'subjectId', 'tenantId'], 'telemetry event');
  if (input.schemaVersion !== EVENT_SCHEMA_VERSION) {
    throw new DomainError('VALIDATION_FAILED', `schemaVersion must be ${EVENT_SCHEMA_VERSION}.`, 400);
  }
  const base: TelemetryEventBase = {
    schemaVersion: EVENT_SCHEMA_VERSION,
    eventId: requireUuid(input.eventId, 'eventId'),
    tenantId: requireIdentifier(input.tenantId, 'tenantId'),
    subjectId: requireIdentifier(input.subjectId, 'subjectId'),
    purpose: requirePurpose(input.purpose),
    eventType: input.eventType as EventType,
    occurredAt: requireTimestamp(input.occurredAt, 'occurredAt'),
  };
  if (base.eventType === 'session.ended') {
    return { ...base, eventType: 'session.ended', payload: parseSessionPayload(input.payload) };
  }
  if (base.eventType === 'activity.completed') {
    return { ...base, eventType: 'activity.completed', payload: parseActivityPayload(input.payload) };
  }
  throw new DomainError('VALIDATION_FAILED', 'eventType is not supported by P0.', 400);
}

function requireBoundedText(value: unknown, name: string, maximumLength: number): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maximumLength) {
    throw new DomainError('VALIDATION_FAILED', `${name} must contain 1–${maximumLength} characters.`, 400);
  }
  return value.trim();
}

/** Parses P5 evidence metadata; the content remains ephemeral after its SHA-256 is calculated. */
export function parseEvidenceSourceRegistration(input: unknown): EvidenceSourceRegistration {
  if (!isRecord(input)) {
    throw new DomainError('VALIDATION_FAILED', 'Evidence source registration must be an object.', 400);
  }
  requireExactKeys(input, ['content', 'domain', 'licenseBasis', 'publishedAt', 'publisher', 'rightsReference', 'sourceKey', 'stableCitation', 'tenantId', 'title', 'version'], 'evidence source registration');
  if (typeof input.domain !== 'string' || !EVIDENCE_DOMAINS.has(input.domain as EvidenceDomain)) {
    throw new DomainError('VALIDATION_FAILED', 'domain is not in the approved corpus-domain catalog.', 400);
  }
  if (typeof input.licenseBasis !== 'string' || !EVIDENCE_LICENSE_BASES.has(input.licenseBasis as EvidenceLicenseBasis)) {
    throw new DomainError('VALIDATION_FAILED', 'licenseBasis is not an approved rights basis.', 400);
  }
  if (typeof input.content !== 'string' || Buffer.byteLength(input.content, 'utf8') === 0 || Buffer.byteLength(input.content, 'utf8') > MAX_EVIDENCE_CONTENT_BYTES) {
    throw new DomainError('VALIDATION_FAILED', `content must contain 1–${MAX_EVIDENCE_CONTENT_BYTES} UTF-8 bytes.`, 400);
  }
  return {
    tenantId: requireIdentifier(input.tenantId, 'tenantId'),
    sourceKey: requireIdentifier(input.sourceKey, 'sourceKey'),
    version: requireIdentifier(input.version, 'version'),
    title: requireBoundedText(input.title, 'title', 256),
    stableCitation: requireBoundedText(input.stableCitation, 'stableCitation', 2_000),
    publisher: requireBoundedText(input.publisher, 'publisher', 256),
    publishedAt: requireTimestamp(input.publishedAt, 'publishedAt'),
    domain: input.domain as EvidenceDomain,
    licenseBasis: input.licenseBasis as EvidenceLicenseBasis,
    rightsReference: requireBoundedText(input.rightsReference, 'rightsReference', 2_000),
    content: input.content,
  };
}

export function assertActor(actor: Actor, allowedRoles: readonly Actor['role'][]): void {
  if (!allowedRoles.includes(actor.role)) {
    throw new DomainError('FORBIDDEN', 'Actor is not authorized for this action.', 403);
  }
}

export function assertTenant(actor: Actor, tenantId: string): void {
  if (actor.tenantId !== tenantId) {
    throw new DomainError('TENANT_MISMATCH', 'Actor tenant does not match the requested tenant.', 403);
  }
}
