import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('aadhaar-in detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['aadhaar-in'] });

  it('detects a valid Aadhaar number', () => {
    const { detections } = masker.maskString('276403465037');
    expect(detections).toContain('aadhaar-in');
  });

  it('does not detect an invalid Aadhaar', () => {
    const { detections } = masker.maskString('123456789012');
    expect(detections).not.toContain('aadhaar-in');
  });

  it('masks to XXXX-XXXX-last4 format', () => {
    const { result } = masker.maskString('276403465037');
    expect(result).toBe('XXXX-XXXX-5037');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['aadhaar-in'] });
    const { result } = redacter.maskString('276403465037');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['aadhaar-in'] });
    const { result, tokenMap } = tokenizer.maskString('276403465037');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('276403465037');
  });
});
