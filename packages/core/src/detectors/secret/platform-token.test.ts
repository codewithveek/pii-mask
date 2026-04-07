import { describe, it, expect } from 'vitest';
import { createMasker } from '@/masker';

describe('platform-token detector', () => {
  it('detects a Slack bot token', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString(
      'xoxb-1234567890-1234567890123-AbCdEfGhIjKlMnOpQrStUvWx',
    );
    expect(detections).toContain('platform-token');
  });

  it('detects a Slack user token (xoxp)', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('xoxp-1234567890-1234567890123-AbCdEfGhIj');
    expect(detections).toContain('platform-token');
  });

  it('detects a Stripe secret key', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('sk_live_ABCDEFGHIJKLMNOPQRSTUVWXYZabcd');
    expect(detections).toContain('platform-token');
  });

  it('detects a Stripe publishable key', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('sk_test_ABCDEFGHIJKLMNOPQRSTUVWXYZabcd');
    expect(detections).toContain('platform-token');
  });

  it('does not detect a random string', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('hello_world_token');
    expect(detections).not.toContain('platform-token');
  });

  it('fully redacts regardless of mode', () => {
    const masker = createMasker({ mode: 'mask' });
    const { result } = masker.maskString('xoxb-1234567890-1234567890123-AbCdEfGhIjKlMnOpQrStUvWx');
    expect(result).toBe('[REDACTED]');
  });

  it('fully redacts in redact mode', () => {
    const masker = createMasker({ mode: 'redact' });
    const { result } = masker.maskString('sk_live_ABCDEFGHIJKLMNOPQRSTUVWXYZabcd');
    expect(result).toBe('[REDACTED]');
  });

  it('detects Slack token in freeform text', () => {
    const masker = createMasker({ mode: 'redact' });
    const input = 'Bot token: xoxb-1234567890-1234567890123-AbCdEfGhIjKlMnOpQrStUvWx leaked.';
    const { result, detections } = masker.maskString(input);
    expect(detections).toContain('platform-token');
    expect(result).not.toContain('xoxb-');
  });
});
