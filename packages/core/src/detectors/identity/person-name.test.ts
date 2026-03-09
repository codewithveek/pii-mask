import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('person-name detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['person-name'] });

  it('detects with name key', () => {
    const { detections } = masker.maskString('John Doe', 'name');
    expect(detections).toContain('person-name');
  });

  it('does not detect without name key', () => {
    const { detections } = masker.maskString('John Doe', 'email');
    expect(detections).not.toContain('person-name');
  });

  it('masks name parts keeping first char', () => {
    const { result } = masker.maskString('John Doe', 'name');
    expect(result).toBe('J*** D**');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['person-name'] });
    const { result } = redacter.maskString('John Doe', 'name');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['person-name'] });
    const { result, tokenMap } = tokenizer.maskString('John Doe', 'name');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('John Doe');
  });
});
