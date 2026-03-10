import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('ssn-us detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['ssn-us'] });

  it('detects a valid SSN', () => {
    const { detections } = masker.maskString('123-45-6789');
    expect(detections).toContain('ssn-us');
  });

  it('does not detect an invalid SSN', () => {
    const { detections } = masker.maskString('123-456-789');
    expect(detections).not.toContain('ssn-us');
  });

  it('masks to ***-**-XXXX format', () => {
    const { result } = masker.maskString('123-45-6789');
    expect(result).toBe('***-**-6789');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['ssn-us'] });
    const { result } = redacter.maskString('123-45-6789');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['ssn-us'] });
    const { result, tokenMap } = tokenizer.maskString('123-45-6789');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('123-45-6789');
  });

  it('generates label in pseudonymize mode', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['ssn-us'] });
    const { result } = pseudonymizer.maskString('123-45-6789');
    expect(result).toBe('SSN_1');
  });

  it('generates label in anonymize mode', () => {
    const anonymizer = createMasker({ mode: 'anonymize', only: ['ssn-us'] });
    const { result } = anonymizer.maskString('123-45-6789');
    expect(result).toBe('SSN_1');
  });

  it('generates plausible SSN in substitute mode', () => {
    const substitutor = createMasker({ mode: 'substitute', only: ['ssn-us'] });
    const { result } = substitutor.maskString('123-45-6789');
    expect(result).not.toBe('123-45-6789');
    expect(result).toMatch(/^\d{3}-\d{2}-\d{4}$/);
  });
});
