import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('bcrypt-hash detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['bcrypt-hash'] });
  const validHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

  it('detects a valid bcrypt hash', () => {
    const { detections } = masker.maskString(validHash);
    expect(detections).toContain('bcrypt-hash');
  });

  it('does not detect a non-hash string', () => {
    const { detections } = masker.maskString('notahash');
    expect(detections).not.toContain('bcrypt-hash');
  });

  it('always redacts regardless of mode', () => {
    const { result } = masker.maskString(validHash);
    expect(result).toBe('[REDACTED]');
  });

  it('redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['bcrypt-hash'] });
    const { result } = redacter.maskString(validHash);
    expect(result).toBe('[REDACTED]');
  });

  it('redacts in substitute mode (secrets always redact)', () => {
    const substitutor = createMasker({ mode: 'substitute', only: ['bcrypt-hash'] });
    const { result } = substitutor.maskString(validHash);
    expect(result).toBe('[REDACTED]');
  });

  it('redacts in pseudonymize mode (secrets always redact)', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['bcrypt-hash'] });
    const { result } = pseudonymizer.maskString(validHash);
    expect(result).toBe('[REDACTED]');
  });
});
