import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('nin-ng detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['nin-ng'] });

  it('detects a valid 11-digit NIN', () => {
    const { detections } = masker.maskString('12345678901', 'nin');
    expect(detections).toContain('nin-ng');
  });

  it('does not detect a 10-digit number', () => {
    const { detections } = masker.maskString('1234567890', 'nin');
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
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('12345678901');
  });
});
