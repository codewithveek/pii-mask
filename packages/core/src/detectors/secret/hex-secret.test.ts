import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('hex-secret detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['hex-secret'] });
  const md5 = 'd41d8cd98f00b204e9800998ecf8427e';
  const sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  it('detects a valid MD5 hex string', () => {
    const { detections } = masker.maskString(md5);
    expect(detections).toContain('hex-secret');
  });

  it('detects a valid SHA256 hex string', () => {
    const { detections } = masker.maskString(sha256);
    expect(detections).toContain('hex-secret');
  });

  it('does not detect a short hex string', () => {
    const { detections } = masker.maskString('d41d8cd98f00');
    expect(detections).not.toContain('hex-secret');
  });

  it('always redacts regardless of mode', () => {
    const { result } = masker.maskString(md5);
    expect(result).toBe('[REDACTED]');
  });

  it('redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['hex-secret'] });
    const { result } = redacter.maskString(sha256);
    expect(result).toBe('[REDACTED]');
  });
});
