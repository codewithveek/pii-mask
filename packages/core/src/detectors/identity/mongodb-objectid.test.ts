import { describe, it, expect } from 'vitest';
import { createMasker } from '@/masker';

describe('mongodb-objectid detector', () => {
  it('detects a valid MongoDB ObjectID', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('507f1f77bcf86cd799439011');
    expect(detections).toContain('mongodb-objectid');
  });

  it('does not detect an invalid hex string (wrong length)', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('507f1f77bcf86cd7994390');
    expect(detections).not.toContain('mongodb-objectid');
  });

  it('does not detect a 24-char hex with implausible timestamp', () => {
    const masker = createMasker({ mode: 'redact' });
    // Timestamp 00000000 = 1970, before MongoDB existed
    const { detections } = masker.maskString('000000001234567890abcdef');
    expect(detections).not.toContain('mongodb-objectid');
  });

  it('masks correctly in default mask mode', () => {
    const masker = createMasker();
    const { result } = masker.maskString('507f1f77bcf86cd799439011');
    expect(result).toContain('507f1f77');
    expect(result).toContain('*');
  });

  it('fully redacts in redact mode', () => {
    const masker = createMasker({ mode: 'redact' });
    const { result } = masker.maskString('507f1f77bcf86cd799439011');
    expect(result).toBe('[REDACTED]');
  });

  it('tokenize round-trip works', () => {
    const masker = createMasker({ mode: 'tokenize' });
    const original = '507f1f77bcf86cd799439011';
    const { result, tokenMap } = masker.maskString(original);
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(masker.restore(result, tokenMap)).toBe(original);
  });

  it('detects ObjectID in freeform text', () => {
    const masker = createMasker({ mode: 'redact' });
    const input = 'Record _id: 507f1f77bcf86cd799439011 not found.';
    const { result, detections } = masker.maskString(input);
    expect(detections).toContain('mongodb-objectid');
    expect(result).not.toContain('507f1f77bcf86cd799439011');
  });

  it('pseudonymize produces consistent labels', () => {
    const masker = createMasker({ mode: 'pseudonymize' });
    const { result } = masker.maskString('507f1f77bcf86cd799439011');
    expect(result).toMatch(/^OBJECTID_\d+$/);
  });
});
