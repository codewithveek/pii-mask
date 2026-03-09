import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('nik-id detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['nik-id'] });

  it('detects a valid NIK', () => {
    const { detections } = masker.maskString('3201234567890001');
    expect(detections).toContain('nik-id');
  });

  it('does not detect invalid province code', () => {
    const { detections } = masker.maskString('0001234567890001');
    expect(detections).not.toContain('nik-id');
  });

  it('masks to ****-****-****-last4 format', () => {
    const { result } = masker.maskString('3201234567890001');
    expect(result).toBe('****-****-****-0001');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['nik-id'] });
    const { result } = redacter.maskString('3201234567890001');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['nik-id'] });
    const { result, tokenMap } = tokenizer.maskString('3201234567890001');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('3201234567890001');
  });
});
