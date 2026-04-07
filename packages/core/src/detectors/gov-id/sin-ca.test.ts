import { describe, it, expect } from 'vitest';
import { createMasker } from '@/masker';

describe('sin-ca detector', () => {
  // 130 692 544 passes Luhn and starts with 1 (valid first digit)
  it('detects a valid Canadian SIN', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('130 692 544');
    expect(detections).toContain('sin-ca');
  });

  it('detects a valid SIN with dashes', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('130-692-544');
    expect(detections).toContain('sin-ca');
  });

  it('does not detect a SIN that fails Luhn', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('123-456-789');
    expect(detections).not.toContain('sin-ca');
  });

  it('does not detect a SIN starting with 0 or 8', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('046-454-286');
    expect(detections).not.toContain('sin-ca');
  });

  it('masks correctly in default mask mode', () => {
    const masker = createMasker();
    const { result } = masker.maskString('130 692 544');
    expect(result).toContain('***');
    expect(result).toContain('544');
  });

  it('fully redacts in redact mode', () => {
    const masker = createMasker({ mode: 'redact' });
    const { result } = masker.maskString('130 692 544');
    expect(result).toBe('[REDACTED]');
  });

  it('tokenize round-trip works', () => {
    const masker = createMasker({ mode: 'tokenize' });
    const original = '130-692-544';
    const { result, tokenMap } = masker.maskString(original);
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(masker.restore(result, tokenMap)).toBe(original);
  });

  it('pseudonymize produces consistent labels', () => {
    const masker = createMasker({ mode: 'pseudonymize' });
    const { result } = masker.maskString('130 692 544');
    expect(result).toMatch(/^SIN_\d+$/);
  });
});
