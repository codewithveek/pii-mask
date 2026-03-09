import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('address detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['address'] });

  it('detects with address key', () => {
    const { detections } = masker.maskString('123 Main Street', 'address');
    expect(detections).toContain('address');
  });

  it('does not detect without address key', () => {
    const { detections } = masker.maskString('123 Main Street', 'email');
    expect(detections).not.toContain('address');
  });

  it('masks preserving first 3 chars', () => {
    const { result } = masker.maskString('123 Main Street', 'address');
    expect(result).toBe('123************');
  });

  it('masks short values fully', () => {
    const { result } = masker.maskString('NYC', 'city');
    expect(result).toBe('***');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['address'] });
    const { result } = redacter.maskString('123 Main Street', 'address');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['address'] });
    const { result, tokenMap } = tokenizer.maskString('123 Main Street', 'address');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('123 Main Street');
  });
});
