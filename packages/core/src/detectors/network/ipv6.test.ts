import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('ipv6 detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['ipv6'] });

  it('detects a valid IPv6 address', () => {
    const { detections } = masker.maskString('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(detections).toContain('ipv6');
  });

  it('does not detect an invalid address', () => {
    const { detections } = masker.maskString('192.168.1.1');
    expect(detections).not.toContain('ipv6');
  });

  it('masks preserving first group', () => {
    const { result } = masker.maskString('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(result).toBe('2001:****:****:****:****:****:****:****');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['ipv6'] });
    const { result } = redacter.maskString('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['ipv6'] });
    const { result, tokenMap } = tokenizer.maskString('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
  });

  it('generates label in pseudonymize mode', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['ipv6'] });
    const { result } = pseudonymizer.maskString('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(result).toBe('IPV6_1');
  });

  it('generates label in anonymize mode', () => {
    const anonymizer = createMasker({ mode: 'anonymize', only: ['ipv6'] });
    const { result } = anonymizer.maskString('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(result).toBe('IPV6_1');
  });

  it('generates plausible IPv6 in substitute mode', () => {
    const substitutor = createMasker({ mode: 'substitute', only: ['ipv6'] });
    const { result } = substitutor.maskString('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(result).not.toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(result).toContain(':');
  });
});
