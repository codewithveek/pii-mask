import type { PIIDetector } from '@/types';
import { PIICategory } from '@/types';
import { registry } from '@/registry';

// Slack bot/user/app tokens: xoxb-, xoxp-, xoxa-, xoxr-, xoxs-
const SLACK_TOKEN_RE = /^xox[bpars]-[\w-]{10,}$/;
const SLACK_TOKEN_PATTERN = /\bxox[bpars]-[\w-]{10,}/g;

// Stripe secret/publishable keys: sk_live_, pk_live_, sk_test_, pk_test_
const STRIPE_KEY_RE = /^[sr]k_(live|test)_[A-Za-z0-9]{20,}$/;
const STRIPE_KEY_PATTERN = /\b[sr]k_(live|test)_[A-Za-z0-9]{20,}\b/g;

const platformTokenDetector: PIIDetector = {
  id: 'platform-token',
  label: 'Platform API Token (Slack/Stripe)',
  category: PIICategory.SECRET,
  // Combined pattern for freeform text scanning
  pattern: new RegExp(`(?:${SLACK_TOKEN_PATTERN.source}|${STRIPE_KEY_PATTERN.source})`, 'g'),

  detect(value) {
    const trimmed = value.trim();
    return SLACK_TOKEN_RE.test(trimmed) || STRIPE_KEY_RE.test(trimmed);
  },

  // Secrets are always fully redacted regardless of mode
  mask: () => '[REDACTED]',
};

registry.register(platformTokenDetector);
