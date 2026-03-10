import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('bvn-ng detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['bvn-ng'] });

  it('detects a valid BVN with key hint', () => {
    const { detections } = masker.maskString('12345678901', 'bvn');
    expect(detections).toContain('bvn-ng');
  });

  it('does not detect without key hint', () => {
    const { detections } = masker.maskString('12345678901');
    expect(detections).not.toContain('bvn-ng');
  });

  it('masks to ***-***-last4 format', () => {
    const { result } = masker.maskString('12345678901', 'bvn');
    expect(result).toBe('***-***-8901');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['bvn-ng'] });
    const { result } = redacter.maskString('12345678901', 'bvn');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['bvn-ng'] });
    const { result, tokenMap } = tokenizer.maskString('12345678901', 'bvn');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('12345678901');
  });

  it('generates label in pseudonymize mode', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['bvn-ng'] });
    const { result } = pseudonymizer.maskString('12345678901', 'bvn');
    expect(result).toBe('BVN_1');
  });

  it('generates label in anonymize mode', () => {
    const anonymizer = createMasker({ mode: 'anonymize', only: ['bvn-ng'] });
    const { result } = anonymizer.maskString('12345678901', 'bvn');
    expect(result).toBe('BVN_1');
  });

  it('generates plausible BVN in substitute mode', () => {
    const substitutor = createMasker({ mode: 'substitute', only: ['bvn-ng'] });
    const { result } = substitutor.maskString('12345678901', 'bvn');
    expect(result).not.toBe('12345678901');
    expect(result).toMatch(/^\d{11}$/);
  });
});
