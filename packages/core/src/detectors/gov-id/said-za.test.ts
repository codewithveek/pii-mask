import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('said-za detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['said-za'] });

  it('detects a valid SA ID', () => {
    const { detections } = masker.maskString('8001015009087');
    expect(detections).toContain('said-za');
  });

  it('does not detect an invalid SA ID', () => {
    const { detections } = masker.maskString('1234567890123');
    expect(detections).not.toContain('said-za');
  });

  it('masks to ***-****-last4 format', () => {
    const { result } = masker.maskString('8001015009087');
    expect(result).toBe('***-****-9087');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['said-za'] });
    const { result } = redacter.maskString('8001015009087');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['said-za'] });
    const { result, tokenMap } = tokenizer.maskString('8001015009087');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('8001015009087');
  });

  it('generates label in pseudonymize mode', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['said-za'] });
    const { result } = pseudonymizer.maskString('8001015009087');
    expect(result).toBe('SAID_1');
  });

  it('generates label in anonymize mode', () => {
    const anonymizer = createMasker({ mode: 'anonymize', only: ['said-za'] });
    const { result } = anonymizer.maskString('8001015009087');
    expect(result).toBe('SAID_1');
  });

  it('generates plausible SA ID in substitute mode', () => {
    const substitutor = createMasker({ mode: 'substitute', only: ['said-za'] });
    const { result } = substitutor.maskString('8001015009087');
    expect(result).not.toBe('8001015009087');
    expect(result).toMatch(/^\d{13}$/);
  });
});
