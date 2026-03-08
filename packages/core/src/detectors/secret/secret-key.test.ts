import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('secret-key detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['secret-key'] });

  it('detects a value with key name "password"', () => {
    const { detections } = masker.maskString('my-secret-value', 'password');
    expect(detections).toContain('secret-key');
  });

  it('detects a value with key name "api_key"', () => {
    const { detections } = masker.maskString('sk-abc123', 'api_key');
    expect(detections).toContain('secret-key');
  });

  it('does not detect without a secret-like key', () => {
    const { detections } = masker.maskString('some-value', 'username');
    expect(detections).not.toContain('secret-key');
  });

  it('always redacts regardless of mode', () => {
    const { result } = masker.maskString('my-secret-value', 'password');
    expect(result).toBe('[REDACTED]');
  });

  it('always redacts in tokenize mode too', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['secret-key'] });
    const { result } = tokenizer.maskString('my-secret', 'secret');
    expect(result).toBe('[REDACTED]');
  });
});
