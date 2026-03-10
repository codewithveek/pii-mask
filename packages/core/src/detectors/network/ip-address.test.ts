import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('ip-address detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['ip-address'] });

  it('detects a valid IPv4 address', () => {
    const { detections } = masker.maskString('192.168.1.1');
    expect(detections).toContain('ip-address');
  });

  it('does not detect an invalid IP (octet > 255)', () => {
    const { detections } = masker.maskString('999.168.1.1');
    expect(detections).not.toContain('ip-address');
  });

  it('masks preserving first octet', () => {
    const { result } = masker.maskString('192.168.1.1');
    expect(result).toBe('192.***.***.***');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['ip-address'] });
    const { result } = redacter.maskString('192.168.1.1');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['ip-address'] });
    const { result, tokenMap } = tokenizer.maskString('192.168.1.1');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('192.168.1.1');
  });

  it('generates label in pseudonymize mode', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['ip-address'] });
    const { result } = pseudonymizer.maskString('192.168.1.1');
    expect(result).toBe('IP_1');
  });

  it('generates label in anonymize mode', () => {
    const anonymizer = createMasker({ mode: 'anonymize', only: ['ip-address'] });
    const { result } = anonymizer.maskString('192.168.1.1');
    expect(result).toBe('IP_1');
  });

  it('generates plausible IP in substitute mode', () => {
    const substitutor = createMasker({ mode: 'substitute', only: ['ip-address'] });
    const { result } = substitutor.maskString('192.168.1.1');
    expect(result).not.toBe('192.168.1.1');
    expect(result).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
  });
});
