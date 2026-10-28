import { lstat, readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { DomainError, type EvidenceSourceRegistration } from '../domain/types.js';
import { parseEvidenceSourceRegistration } from '../domain/validation.js';

const MANIFEST_FILE = 'manifest.json';
const CONTENT_FILE = 'source.txt';
const MAX_MANIFEST_BYTES = 8 * 1024;
const MAX_CONTENT_BYTES = 48 * 1024;
const MANIFEST_KEYS = ['domain', 'licenseBasis', 'publishedAt', 'publisher', 'rightsReference', 'sourceKey', 'stableCitation', 'tenantId', 'title', 'version'] as const;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pathInsideDirectory(directory: string, filename: string): string {
  const root = resolve(directory);
  const candidate = resolve(root, filename);
  if (!candidate.startsWith(`${root}${sep}`)) {
    throw new DomainError('VALIDATION_FAILED', 'Evidence fixture path escapes its declared directory.', 400);
  }
  return candidate;
}

async function readRegularFile(path: string, maximumBytes: number, label: string): Promise<Buffer> {
  const metadata = await lstat(path).catch(() => {
    throw new DomainError('NOT_FOUND', `${label} is missing from the evidence fixture.`, 404);
  });
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size === 0 || metadata.size > maximumBytes) {
    throw new DomainError('VALIDATION_FAILED', `${label} must be a regular non-empty file no larger than ${maximumBytes} bytes.`, 400);
  }
  return readFile(path);
}

function parseManifest(buffer: Buffer): JsonRecord {
  let value: unknown;
  try {
    value = JSON.parse(buffer.toString('utf8'));
  } catch {
    throw new DomainError('VALIDATION_FAILED', 'Evidence manifest must contain valid JSON.', 400);
  }
  if (!isRecord(value)) {
    throw new DomainError('VALIDATION_FAILED', 'Evidence manifest must be an object.', 400);
  }
  const record = value;
  const actualKeys = Object.keys(record).sort();
  const expectedKeys = [...MANIFEST_KEYS].sort();
  if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) {
    throw new DomainError('VALIDATION_FAILED', 'Evidence manifest contains missing or unsupported fields.', 400);
  }
  return record;
}

/** Reads a deterministic local fixture bundle. No URLs are fetched and no source text is persisted. */
export async function readLocalEvidenceFixture(directory: string): Promise<EvidenceSourceRegistration> {
  const manifestPath = pathInsideDirectory(directory, MANIFEST_FILE);
  const contentPath = pathInsideDirectory(directory, CONTENT_FILE);
  const [manifestBytes, contentBytes] = await Promise.all([
    readRegularFile(manifestPath, MAX_MANIFEST_BYTES, MANIFEST_FILE),
    readRegularFile(contentPath, MAX_CONTENT_BYTES, CONTENT_FILE),
  ]);
  return parseEvidenceSourceRegistration({ ...parseManifest(manifestBytes), content: contentBytes.toString('utf8') });
}