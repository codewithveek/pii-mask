import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('phone-global detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['phone-global'] });

  it('detects a valid phone number', () => {
    const { detections } = masker.maskString('+14155552671');
    expect(detections).toContain('phone-global');
  });

  it('does not detect an invalid phone number', () => {
    const { detections } = masker.maskString('12345');
    expect(detections).not.toContain('phone-global');
  });

  it('masks phone preserving last 4 digits', () => {
    const { result } = masker.maskString('+14155552671');
    expect(result).toContain('2671');
    expect(result).toContain('***');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['phone-global'] });
    const { result } = redacter.maskString('+14155552671');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['phone-global'] });
    const { result, tokenMap } = tokenizer.maskString('+14155552671');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('+14155552671');
  });

  it('generates label in pseudonymize mode', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['phone-global'] });
    const { result } = pseudonymizer.maskString('+14155552671');
    expect(result).toBe('PHONE_1');
  });

  it('generates label in anonymize mode', () => {
    const anonymizer = createMasker({ mode: 'anonymize', only: ['phone-global'] });
    const { result } = anonymizer.maskString('+14155552671');
    expect(result).toBe('PHONE_1');
  });

  it('generates plausible phone in substitute mode', () => {
    const substitutor = createMasker({ mode: 'substitute', only: ['phone-global'] });
    const { result } = substitutor.maskString('+14155552671');
    expect(result).not.toBe('+14155552671');
    expect(result.length).toBeGreaterThan(5);
  });
});
