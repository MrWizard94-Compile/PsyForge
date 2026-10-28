import { DomainError, type EpistemicTier, type GraphAssertionRegistration, type GraphNodeInput } from './types.js';

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const GRAPH_NODE_TYPES = new Set(['corpus_concept', 'domain_entity']);
const GRAPH_EDGE_TYPES = new Set(['belongs_to']);

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

function isUuid(value: string): boolean {
  const segments = value.split('-');
  const lengths = [8, 4, 4, 4, 12];
  const hexCharacters = '0123456789abcdef';
  return segments.length === lengths.length
    && segments.every((segment, index) => segment.length === lengths[index] && [...segment.toLowerCase()].every((character) => hexCharacters.includes(character)))
    && '12345'.includes(segments[2]![0]!)
    && '89ab'.includes(segments[3]![0]!.toLowerCase());
}
function requireIdentifier(value: unknown, name: string): string {
  if (typeof value !== 'string' || !IDENTIFIER_PATTERN.test(value)) {
    throw new DomainError('VALIDATION_FAILED', `${name} must be a 1–128 character opaque identifier.`, 400);
  }
  return value;
}

function parseNode(value: unknown, name: string): GraphNodeInput {
  if (!isRecord(value)) {
    throw new DomainError('VALIDATION_FAILED', `${name} must be an object.`, 400);
  }
  requireExactKeys(value, ['key', 'label', 'type'], name);
  if (typeof value.type !== 'string' || !GRAPH_NODE_TYPES.has(value.type)) {
    throw new DomainError('VALIDATION_FAILED', `${name}.type is not in the P6 closed node vocabulary.`, 400);
  }
  if (typeof value.label !== 'string' || value.label.trim().length === 0 || value.label.length > 256) {
    throw new DomainError('VALIDATION_FAILED', `${name}.label must contain 1–256 characters.`, 400);
  }
  return { key: requireIdentifier(value.key, `${name}.key`), label: value.label.trim(), type: value.type as GraphNodeInput['type'] };
}

/** Parses the P6 structural-only assertion contract; no causal or inferred graph write exists. */
export function parseGraphAssertionRegistration(input: unknown): GraphAssertionRegistration {
  if (!isRecord(input)) {
    throw new DomainError('VALIDATION_FAILED', 'Graph assertion must be an object.', 400);
  }
  requireExactKeys(input, ['edgeType', 'epistemicTier', 'evidenceSourceId', 'sourceNode', 'targetNode', 'tenantId'], 'graph assertion');
  if (typeof input.evidenceSourceId !== 'string' || !isUuid(input.evidenceSourceId)) {
    throw new DomainError('VALIDATION_FAILED', 'evidenceSourceId must be a UUID.', 400);
  }
  if (input.edgeType !== 'belongs_to' || !GRAPH_EDGE_TYPES.has(input.edgeType)) {
    throw new DomainError('VALIDATION_FAILED', 'edgeType must be the P6 structural belongs_to relationship.', 400);
  }
  const epistemicTier = input.epistemicTier as EpistemicTier;
  if (epistemicTier !== 'observed') {
    throw new DomainError('VALIDATION_FAILED', 'P6 accepts observed structural assertions only; it does not perform inference.', 400);
  }
  const sourceNode = parseNode(input.sourceNode, 'sourceNode');
  const targetNode = parseNode(input.targetNode, 'targetNode');
  if (sourceNode.type !== 'corpus_concept' || targetNode.type !== 'domain_entity') {
    throw new DomainError('VALIDATION_FAILED', 'P6 permits only Corpus Concept → Belongs_To → Domain Entity assertions.', 400);
  }
  return {
    tenantId: requireIdentifier(input.tenantId, 'tenantId'), evidenceSourceId: input.evidenceSourceId,
    sourceNode, targetNode, edgeType: 'belongs_to', epistemicTier: 'observed',
  };
}