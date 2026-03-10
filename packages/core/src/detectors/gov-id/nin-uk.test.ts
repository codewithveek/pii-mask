import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('nin-uk detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['nin-uk'] });

  it('detects a valid UK NIN', () => {
    const { detections } = masker.maskString('AB123456C');
    expect(detections).toContain('nin-uk');
  });

  it('does not detect an invalid NIN', () => {
    const { detections } = masker.maskString('AB123456E');
    expect(detections).not.toContain('nin-uk');
  });

  it('masks to XX-****-suffix format', () => {
    const { result } = masker.maskString('AB123456C');
    expect(result).toBe('XX-****-C');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['nin-uk'] });
    const { result } = redacter.maskString('AB123456C');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['nin-uk'] });
    const { result, tokenMap } = tokenizer.maskString('AB123456C');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('AB123456C');
  });

  it('generates label in pseudonymize mode', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['nin-uk'] });
    const { result } = pseudonymizer.maskString('AB123456C');
    expect(result).toBe('NIN_UK_1');
  });

  it('generates label in anonymize mode', () => {
    const anonymizer = createMasker({ mode: 'anonymize', only: ['nin-uk'] });
    const { result } = anonymizer.maskString('AB123456C');
    expect(result).toBe('NIN_UK_1');
  });

  it('generates plausible NIN in substitute mode', () => {
    const substitutor = createMasker({ mode: 'substitute', only: ['nin-uk'] });
    const { result } = substitutor.maskString('AB123456C');
    expect(result).not.toBe('AB123456C');
    expect(result).toMatch(/^[A-Z]{2}\d{6}[A-D]$/);
  });
});
