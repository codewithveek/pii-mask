import { describe, it, expect } from 'vitest';
import { createMasker } from '@/masker';

describe('aws-key detector', () => {
  it('detects a valid AWS access key (AKIA prefix)', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('AKIAIOSFODNN7EXAMPLE');
    expect(detections).toContain('aws-key');
  });

  it('detects a valid AWS STS key (ASIA prefix)', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('ASIAIOSFODNN7EXAMPLE');
    expect(detections).toContain('aws-key');
  });

  it('does not detect an invalid AWS key (wrong prefix)', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('ABCDIOSFODNN7EXAMPLE');
    expect(detections).not.toContain('aws-key');
  });

  it('does not detect an AWS key that is too short', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('AKIA1234');
    expect(detections).not.toContain('aws-key');
  });

  it('fully redacts regardless of mode', () => {
    const masker = createMasker({ mode: 'mask' });
    const { result } = masker.maskString('AKIAIOSFODNN7EXAMPLE');
    expect(result).toBe('[REDACTED]');
  });

  it('fully redacts in redact mode', () => {
    const masker = createMasker({ mode: 'redact' });
    const { result } = masker.maskString('AKIAIOSFODNN7EXAMPLE');
    expect(result).toBe('[REDACTED]');
  });

  it('detects AWS key in freeform text', () => {
    const masker = createMasker({ mode: 'redact' });
    const input = 'Access key: AKIAIOSFODNN7EXAMPLE found in config.';
    const { result, detections } = masker.maskString(input);
    expect(detections).toContain('aws-key');
    expect(result).not.toContain('AKIAIOSFODNN7EXAMPLE');
  });
});
