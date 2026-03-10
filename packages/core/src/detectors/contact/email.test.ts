import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('email detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['email'] });

  it('detects a valid email', () => {
    const { detections } = masker.maskString('test@example.com');
    expect(detections).toContain('email');
  });

  it('does not detect an invalid email', () => {
    const { detections } = masker.maskString('not-an-email');
    expect(detections).not.toContain('email');
  });

  it('masks email preserving domain', () => {
    const { result } = masker.maskString('john@example.com');
    expect(result).toContain('@example.com');
    expect(result).not.toBe('john@example.com');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['email'] });
    const { result } = redacter.maskString('test@example.com');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['email'] });
    const { result, tokenMap } = tokenizer.maskString('test@example.com');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('test@example.com');
  });

  it('generates consistent labels in pseudonymize mode', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['email'] });
    const { result } = pseudonymizer.maskString('test@example.com');
    expect(result).toBe('EMAIL_1');
  });

  it('generates consistent labels in anonymize mode', () => {
    const anonymizer = createMasker({ mode: 'anonymize', only: ['email'] });
    const r1 = anonymizer.maskString('test@example.com');
    const r2 = anonymizer.maskString('other@example.com');
    expect(r1.result).toBe('EMAIL_1');
    expect(r2.result).toBe('EMAIL_2');
  });

  it('generates plausible email in substitute mode', () => {
    const substitutor = createMasker({ mode: 'substitute', only: ['email'] });
    const { result } = substitutor.maskString('test@example.com');
    expect(result).not.toBe('test@example.com');
    expect(result).toContain('@');
  });
});
