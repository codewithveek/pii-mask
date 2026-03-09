import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('cpf-br detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['cpf-br'] });

  it('detects a valid CPF', () => {
    const { detections } = masker.maskString('529.982.247-25');
    expect(detections).toContain('cpf-br');
  });

  it('does not detect an invalid CPF', () => {
    const { detections } = masker.maskString('111.111.111-11');
    expect(detections).not.toContain('cpf-br');
  });

  it('masks preserving middle digits', () => {
    const { result } = masker.maskString('529.982.247-25');
    expect(result).toBe('***.***.247-**');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['cpf-br'] });
    const { result } = redacter.maskString('529.982.247-25');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['cpf-br'] });
    const { result, tokenMap } = tokenizer.maskString('529.982.247-25');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('529.982.247-25');
  });
});
