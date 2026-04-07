import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel, generateToken } from '@/engine';

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
      // Generate a plausible ObjectID-shaped hex string
      const hex = generateToken()
        .replace(/[^a-f0-9]/g, '')
        .padEnd(24, '0')
        .slice(0, 24);
      return hex;
    }
    // Default mask: preserve first 8 chars (timestamp), mask the rest
    return `${value.slice(0, 8)}****************`;
  },
};

registry.register(mongodbObjectIdDetector);
