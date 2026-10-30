import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel, randomHex } from '@/engine';

// MongoDB ObjectID: exactly 24 hex characters
const OBJECTID_RE = /^[a-fA-F0-9]{24}$/;
const OBJECTID_PATTERN = /\b[a-fA-F0-9]{24}\b/g;

function isValidObjectId(hex: string): boolean {
  // First 8 chars are a unix timestamp — must decode to a plausible date
  const timestamp = parseInt(hex.slice(0, 8), 16);
  // MongoDB didn't exist before 2009 (~1230000000) and should be before 2100 (~4102444800)
  return timestamp > 1_230_000_000 && timestamp < 4_102_444_800;
}

const mongodbObjectIdDetector: PIIDetector = {
  id: 'mongodb-objectid',
  label: 'MongoDB ObjectID',
  category: PIICategory.IDENTITY,
  pattern: OBJECTID_PATTERN,
  prefilter: /[a-fA-F0-9]{24}/,

  detect(value) {
    const trimmed = value.trim();
    if (!OBJECTID_RE.test(trimmed)) return false;
    return isValidObjectId(trimmed);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('OBJECTID', value, ctx, PIICategory.IDENTITY);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      // Plausible ObjectID: current timestamp + 8 random bytes
      const ts = Math.floor(Date.now() / 1000)
        .toString(16)
        .padStart(8, '0');
      return `${ts}${randomHex(8)}`;
    }
    // Default mask: preserve first 8 chars (timestamp), mask the rest
    return `${value.slice(0, 8)}****************`;
  },
};

registry.register(mongodbObjectIdDetector);
