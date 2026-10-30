import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { createMasker } from '../../masker.js';

describe('nin-ng detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['nin-ng'] });

  it('detects a valid 11-digit NIN', () => {
    const { detections } = masker.maskString('12345678901', 'nin');
    expect(detections).toContain('nin-ng');
  });

  it('still masks a malformed value under a NIN key', () => {
    const { detections } = masker.maskString('1234567890', 'nin');
    expect(detections).toContain('nin-ng');
  });

  it('does not claim a bare 11-digit number without a NIN key', () => {
    const { detections } = masker.maskString('12345678901');
    expect(detections).not.toContain('nin-ng');
  });

  it('masks to ***-***-XXXX format', () => {
    const { result } = masker.maskString('12345678901', 'nin');
    expect(result).toBe('***-***-8901');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['nin-ng'] });
    const { result } = redacter.maskString('12345678901', 'nin');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['nin-ng'] });
    const { result, tokenMap } = tokenizer.maskString('12345678901', 'nin');
    expect(result).toMatch(/^<<PII_[a-f0-9]{16}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('12345678901');
  });

  it('generates label in pseudonymize mode', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['nin-ng'] });
    const { result } = pseudonymizer.maskString('12345678901', 'nin');
    expect(result).toBe('NIN_1');
  });

  it('generates label in anonymize mode', () => {
    const anonymizer = createMasker({ mode: 'anonymize', only: ['nin-ng'] });
    const { result } = anonymizer.maskString('12345678901', 'nin');
    expect(result).toBe('NIN_1');
  });

  it('generates plausible NIN in substitute mode', () => {
    const substitutor = createMasker({ mode: 'substitute', faker, only: ['nin-ng'] });
    const { result } = substitutor.maskString('12345678901', 'nin');
    expect(result).not.toBe('12345678901');
    expect(result).toMatch(/^\d{11}$/);
  });
});
