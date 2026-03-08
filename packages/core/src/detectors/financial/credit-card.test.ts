import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('credit-card detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['credit-card'] });

  it('detects a valid Visa card (Luhn valid)', () => {
    // 4532015112830366 is a Luhn-valid test number
    const { detections } = masker.maskString('4532015112830366');
    expect(detections).toContain('credit-card');
  });

  it('does not detect an invalid card number', () => {
    const { detections } = masker.maskString('1234567890123456');
    expect(detections).not.toContain('credit-card');
  });

  it('masks preserving first and last 4 digits', () => {
    const { result } = masker.maskString('4532015112830366');
    expect(result).toBe('4532-XXXX-XXXX-0366');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['credit-card'] });
    const { result } = redacter.maskString('4532015112830366');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['credit-card'] });
    const { result, tokenMap } = tokenizer.maskString('4532015112830366');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('4532015112830366');
  });
});
