import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('iban detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['iban'] });

  it('detects a valid IBAN', () => {
    const { detections } = masker.maskString('GB29NWBK60161331926819');
    expect(detections).toContain('iban');
  });

  it('does not detect an invalid IBAN', () => {
    const { detections } = masker.maskString('GB00NWBK60161331926819');
    expect(detections).not.toContain('iban');
  });

  it('masks preserving first and last 4 chars', () => {
    const { result } = masker.maskString('GB29NWBK60161331926819');
    expect(result).toBe('GB29**************6819');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['iban'] });
    const { result } = redacter.maskString('DE89370400440532013000');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['iban'] });
    const { result, tokenMap } = tokenizer.maskString('GB29NWBK60161331926819');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('GB29NWBK60161331926819');
  });
});
