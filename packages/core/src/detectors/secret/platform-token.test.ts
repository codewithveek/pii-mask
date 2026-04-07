import { describe, it, expect } from 'vitest';
import { createMasker } from '@/masker';

// Test tokens are intentionally fake (zeroed-out) to avoid triggering secret scanners.
// They still match the detector regex patterns.
const FAKE_SLACK_BOT = ['xoxb', '0000000000', '0000000000000', 'FakeTestValueOnly00000000'].join(
  '-',
);
const FAKE_SLACK_USER = ['xoxp', '0000000000', '0000000000000', 'FakeTestXx'].join('-');
const FAKE_STRIPE_LIVE = 'sk_live_' + '0'.repeat(30);
const FAKE_STRIPE_TEST = 'sk_test_' + '0'.repeat(30);

describe('platform-token detector', () => {
  it('detects a Slack bot token', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString(FAKE_SLACK_BOT);
    expect(detections).toContain('platform-token');
  });

  it('detects a Slack user token (xoxp)', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString(FAKE_SLACK_USER);
    expect(detections).toContain('platform-token');
  });

  it('detects a Stripe secret key', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString(FAKE_STRIPE_LIVE);
    expect(detections).toContain('platform-token');
  });

  it('detects a Stripe publishable key', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString(FAKE_STRIPE_TEST);
    expect(detections).toContain('platform-token');
  });

  it('does not detect a random string', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('hello_world_token');
    expect(detections).not.toContain('platform-token');
  });

  it('fully redacts regardless of mode', () => {
    const masker = createMasker({ mode: 'mask' });
    const { result } = masker.maskString(FAKE_SLACK_BOT);
    expect(result).toBe('[REDACTED]');
  });

  it('fully redacts in redact mode', () => {
    const masker = createMasker({ mode: 'redact' });
    const { result } = masker.maskString(FAKE_STRIPE_LIVE);
    expect(result).toBe('[REDACTED]');
  });

  it('detects Slack token in freeform text', () => {
    const masker = createMasker({ mode: 'redact' });
    const input = `Bot token: ${FAKE_SLACK_BOT} leaked.`;
    const { result, detections } = masker.maskString(input);
    expect(detections).toContain('platform-token');
    expect(result).not.toContain('xoxb-');
  });
});
