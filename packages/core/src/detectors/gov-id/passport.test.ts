import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('passport detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['passport'] });

  it('detects a valid passport number with key hint', () => {
    const { detections } = masker.maskString('AB1234567', 'passport_number');
    expect(detections).toContain('passport');
  });

  it('does not detect without key hint', () => {
    const { detections } = masker.maskString('AB1234567');
    expect(detections).not.toContain('passport');
  });

  it('masks to ***-last3 format', () => {
    const { result } = masker.maskString('AB1234567', 'passport_number');
    expect(result).toBe('***567');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['passport'] });
    const { result } = redacter.maskString('AB1234567', 'passport');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['passport'] });
    const { result, tokenMap } = tokenizer.maskString('AB1234567', 'passport_number');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('AB1234567');
  });

  it('generates label in pseudonymize mode', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['passport'] });
    const { result } = pseudonymizer.maskString('AB1234567', 'passport_number');
    expect(result).toBe('PASSPORT_1');
  });

  it('generates label in anonymize mode', () => {
    const anonymizer = createMasker({ mode: 'anonymize', only: ['passport'] });
    const { result } = anonymizer.maskString('AB1234567', 'passport_number');
    expect(result).toBe('PASSPORT_1');
  });

  it('detects passport in freeform text', () => {
    const all = createMasker({ mode: 'pseudonymize' });
    const { result, detections } = all.maskString('Her passport number is 9204830571.');
    expect(detections).toContain('passport');
    expect(result).toContain('PASSPORT_');
  });

  it('detects passport number with colon separator', () => {
    const all = createMasker({ mode: 'redact' });
    const { result, detections } = all.maskString('Passport no: AB123456');
    expect(detections).toContain('passport');
    expect(result).toContain('[REDACTED]');
  });
});
