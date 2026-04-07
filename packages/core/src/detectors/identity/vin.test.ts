import { describe, it, expect } from 'vitest';
import { createMasker } from '@/masker';

describe('vin detector', () => {
  // 1HGBH41JXMN109186 is a well-known valid VIN (Honda Civic)
  it('detects a valid VIN', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('1HGBH41JXMN109186');
    expect(detections).toContain('vin');
  });

  it('does not detect a VIN with invalid check digit', () => {
    const masker = createMasker({ mode: 'redact' });
    // Changed check digit position (9th char) to 0 instead of X
    const { detections } = masker.maskString('1HGBH41J0MN109186');
    expect(detections).not.toContain('vin');
  });

  it('does not detect strings with invalid VIN characters (I, O, Q)', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('1HGBI41JXMN109186');
    expect(detections).not.toContain('vin');
  });

  it('does not detect strings shorter than 17 chars', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('1HGBH41JXM');
    expect(detections).not.toContain('vin');
  });

  it('masks correctly in default mask mode', () => {
    const masker = createMasker();
    const { result } = masker.maskString('1HGBH41JXMN109186');
    expect(result).toContain('1HG');
    expect(result).toContain('109186');
    expect(result).toContain('*');
  });

  it('fully redacts in redact mode', () => {
    const masker = createMasker({ mode: 'redact' });
    const { result } = masker.maskString('1HGBH41JXMN109186');
    expect(result).toBe('[REDACTED]');
  });

  it('tokenize round-trip works', () => {
    const masker = createMasker({ mode: 'tokenize' });
    const original = '1HGBH41JXMN109186';
    const { result, tokenMap } = masker.maskString(original);
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(masker.restore(result, tokenMap)).toBe(original);
  });

  it('detects VIN in freeform text', () => {
    const masker = createMasker({ mode: 'redact' });
    const input = 'Vehicle VIN: 1HGBH41JXMN109186 registered.';
    const { result, detections } = masker.maskString(input);
    expect(detections).toContain('vin');
    expect(result).not.toContain('1HGBH41JXMN109186');
  });
});
