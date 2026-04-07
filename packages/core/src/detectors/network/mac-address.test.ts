import { describe, it, expect } from 'vitest';
import { createMasker } from '@/masker';

describe('mac-address detector', () => {
  it('detects a valid MAC address (colon-separated)', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('00:1A:2B:3C:4D:5E');
    expect(detections).toContain('mac-address');
  });

  it('detects a valid MAC address (dash-separated)', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('00-1A-2B-3C-4D-5E');
    expect(detections).toContain('mac-address');
  });

  it('does not detect an invalid MAC address (too few groups)', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('00:1A:2B:3C');
    expect(detections).not.toContain('mac-address');
  });

  it('does not detect a random hex string', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('001A2B3C4D5E');
    expect(detections).not.toContain('mac-address');
  });

  it('masks correctly in default mask mode', () => {
    const masker = createMasker();
    const { result } = masker.maskString('00:1A:2B:3C:4D:5E');
    expect(result).toContain('00:1A:2B');
    expect(result).toContain('XX');
  });

  it('fully redacts in redact mode', () => {
    const masker = createMasker({ mode: 'redact' });
    const { result } = masker.maskString('00:1A:2B:3C:4D:5E');
    expect(result).toBe('[REDACTED]');
  });

  it('tokenize round-trip works', () => {
    const masker = createMasker({ mode: 'tokenize' });
    const original = '00:1A:2B:3C:4D:5E';
    const { result, tokenMap } = masker.maskString(original);
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(masker.restore(result, tokenMap)).toBe(original);
  });

  it('detects MAC address in freeform text', () => {
    const masker = createMasker({ mode: 'redact' });
    const input = 'Device MAC: 00:1A:2B:3C:4D:5E connected to network.';
    const { result, detections } = masker.maskString(input);
    expect(detections).toContain('mac-address');
    expect(result).not.toContain('00:1A:2B:3C:4D:5E');
  });
});
