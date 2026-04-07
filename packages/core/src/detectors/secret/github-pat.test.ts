import { describe, it, expect } from 'vitest';
import { createMasker } from '@/masker';

describe('github-pat detector', () => {
  it('detects a valid GitHub personal access token', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef1234');
    expect(detections).toContain('github-pat');
  });

  it('detects a valid GitHub OAuth token (gho_ prefix)', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('gho_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef1234');
    expect(detections).toContain('github-pat');
  });

  it('does not detect a token with wrong prefix', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('ghx_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef1234');
    expect(detections).not.toContain('github-pat');
  });

  it('does not detect a token that is too short', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('ghp_short');
    expect(detections).not.toContain('github-pat');
  });

  it('fully redacts regardless of mode', () => {
    const masker = createMasker({ mode: 'mask' });
    const { result } = masker.maskString('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef1234');
    expect(result).toBe('[REDACTED]');
  });

  it('fully redacts in redact mode', () => {
    const masker = createMasker({ mode: 'redact' });
    const { result } = masker.maskString('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef1234');
    expect(result).toBe('[REDACTED]');
  });

  it('detects GitHub PAT in freeform text', () => {
    const masker = createMasker({ mode: 'redact' });
    const input = 'Token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef1234 leaked.';
    const { result, detections } = masker.maskString(input);
    expect(detections).toContain('github-pat');
    expect(result).not.toContain('ghp_');
  });
});
