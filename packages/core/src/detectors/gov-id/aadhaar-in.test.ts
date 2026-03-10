import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('aadhaar-in detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['aadhaar-in'] });

  it('detects a valid Aadhaar number', () => {
    const { detections } = masker.maskString('276403465037');
    expect(detections).toContain('aadhaar-in');
  });

  it('does not detect an invalid Aadhaar', () => {
    const { detections } = masker.maskString('123456789012');
    expect(detections).not.toContain('aadhaar-in');
  });

  it('masks to XXXX-XXXX-last4 format', () => {
    const { result } = masker.maskString('276403465037');
    expect(result).toBe('XXXX-XXXX-5037');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['aadhaar-in'] });
    const { result } = redacter.maskString('276403465037');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['aadhaar-in'] });
    const { result, tokenMap } = tokenizer.maskString('276403465037');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('276403465037');
  });

  it('generates label in pseudonymize mode', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['aadhaar-in'] });
    const { result } = pseudonymizer.maskString('276403465037');
    expect(result).toBe('AADHAAR_1');
  });

  it('generates label in anonymize mode', () => {
    const anonymizer = createMasker({ mode: 'anonymize', only: ['aadhaar-in'] });
    const { result } = anonymizer.maskString('276403465037');
    expect(result).toBe('AADHAAR_1');
  });

  it('generates plausible number in substitute mode', () => {
    const substitutor = createMasker({ mode: 'substitute', only: ['aadhaar-in'] });
    const { result } = substitutor.maskString('276403465037');
    expect(result).not.toBe('276403465037');
    expect(result).toMatch(/^\d{12}$/);
  });
});
