import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('dob detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['dob'] });

  it('detects a valid ISO date of birth', () => {
    const { detections } = masker.maskString('1990-01-15', 'dob');
    expect(detections).toContain('dob');
  });

  it('does not detect an invalid date', () => {
    const { detections } = masker.maskString('hello', 'dob');
    expect(detections).not.toContain('dob');
  });

  it('masks ISO date preserving year', () => {
    const { result } = masker.maskString('1990-01-15', 'dob');
    expect(result).toBe('1990-**-**');
  });

  it('masks MDY date fully', () => {
    const { result } = masker.maskString('01/15/1990', 'birthday');
    expect(result).toBe('**/**/****');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['dob'] });
    const { result } = redacter.maskString('1990-01-15', 'dob');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['dob'] });
    const { result, tokenMap } = tokenizer.maskString('1990-01-15', 'dob');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('1990-01-15');
  });

  it('generates label in pseudonymize mode', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['dob'] });
    const { result } = pseudonymizer.maskString('1990-01-15', 'dob');
    expect(result).toBe('DOB_1');
  });

  it('generates label in anonymize mode', () => {
    const anonymizer = createMasker({ mode: 'anonymize', only: ['dob'] });
    const { result } = anonymizer.maskString('1990-01-15', 'dob');
    expect(result).toBe('DOB_1');
  });

  it('generates plausible date in substitute mode', () => {
    const substitutor = createMasker({ mode: 'substitute', only: ['dob'] });
    const { result } = substitutor.maskString('1990-01-15', 'dob');
    expect(result).not.toBe('1990-01-15');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
