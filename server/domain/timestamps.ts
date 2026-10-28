import { DomainError } from './types.js';

const ISO_8601_TIMESTAMP_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.(\d{1,3}))?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  }
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/**
 * Accepts the deterministic extended ISO-8601 profile used at external boundaries.
 * An explicit UTC designator or numeric offset is required; output is canonical UTC
 * with millisecond precision so persisted timestamps compare and replay consistently.
 */
export function normalizeIso8601Timestamp(value: unknown, name: string): string {
  if (typeof value !== 'string') {
    throw new DomainError('VALIDATION_FAILED', `${name} must be an ISO-8601 timestamp with an explicit UTC offset.`, 400);
  }
  const match = ISO_8601_TIMESTAMP_PATTERN.exec(value);
  if (match === null) {
    throw new DomainError('VALIDATION_FAILED', `${name} must be an ISO-8601 timestamp with an explicit UTC offset.`, 400);
  }
  const year = Number.parseInt(match[1]!, 10);
  const month = Number.parseInt(match[2]!, 10);
  const day = Number.parseInt(match[3]!, 10);
  if (day > daysInMonth(year, month)) {
    throw new DomainError('VALIDATION_FAILED', `${name} must be a real ISO-8601 calendar timestamp.`, 400);
  }
  const milliseconds = Date.parse(value);
  if (Number.isNaN(milliseconds)) {
    throw new DomainError('VALIDATION_FAILED', `${name} must be an ISO-8601 timestamp with an explicit UTC offset.`, 400);
  }
  return new Date(milliseconds).toISOString();
}