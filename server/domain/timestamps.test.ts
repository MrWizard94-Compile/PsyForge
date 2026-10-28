import { describe, expect, it } from 'vitest';
import { normalizeIso8601Timestamp } from './timestamps.js';

describe('ISO-8601 timestamp normalization', () => {
  it('accepts explicit UTC or numeric offsets and stores canonical UTC milliseconds', () => {
    expect(normalizeIso8601Timestamp('2026-08-21T12:00:00Z', 'occurredAt')).toBe('2026-08-21T12:00:00.000Z');
    expect(normalizeIso8601Timestamp('2026-08-21T13:30:00.5+01:30', 'occurredAt')).toBe('2026-08-21T12:00:00.500Z');
  });

  it('rejects ambiguous, noncanonical, and impossible calendar values', () => {
    for (const value of [
      'August 21, 2026 12:00:00 UTC',
      '2026-08-21T12:00:00',
      '2026-02-30T12:00:00.000Z',
      '2026-08-21T12:00:00.0000Z',
      '2026-08-21T24:00:00.000Z',
      '2026-08-21T12:00:00.000+24:00',
    ]) {
      expect(() => normalizeIso8601Timestamp(value, 'occurredAt')).toThrow(/occurredAt/);
    }
  });
});