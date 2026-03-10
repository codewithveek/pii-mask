import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('pan-in detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['pan-in'] });

  it('detects a valid PAN', () => {
    const { detections } = masker.maskString('BNZPM2501F');
    expect(detections).toContain('pan-in');
  });

  it('does not detect an invalid PAN', () => {
    const { detections } = masker.maskString('12345ABCDE');
    expect(detections).not.toContain('pan-in');
  });

  it('masks preserving first 3 chars and last char', () => {
    const { result } = masker.maskString('BNZPM2501F');
    expect(result).toBe('BNZX****F');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['pan-in'] });
    const { result } = redacter.maskString('BNZPM2501F');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['pan-in'] });
    const { result, tokenMap } = tokenizer.maskString('BNZPM2501F');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('BNZPM2501F');
  });

  it('generates label in pseudonymize mode', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['pan-in'] });
    const { result } = pseudonymizer.maskString('BNZPM2501F');
    expect(result).toBe('PAN_1');
  });

  it('generates label in anonymize mode', () => {
    const anonymizer = createMasker({ mode: 'anonymize', only: ['pan-in'] });
    const { result } = anonymizer.maskString('BNZPM2501F');
    expect(result).toBe('PAN_1');
  });

  it('generates plausible PAN in substitute mode', () => {
    const substitutor = createMasker({ mode: 'substitute', only: ['pan-in'] });
    const { result } = substitutor.maskString('BNZPM2501F');
    expect(result).not.toBe('BNZPM2501F');
    expect(result).toMatch(/^[A-Z]{5}\d{4}[A-Z]$/);
  });
});
