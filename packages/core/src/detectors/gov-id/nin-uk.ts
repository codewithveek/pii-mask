import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel, randomInt } from '@/engine';
import { randomDigits } from '../utils';

// UK National Insurance Number: 2 letters, 6 digits, 1 letter (A-D)
// Both unspaced (AB123456C) and spaced (AB 12 34 56 C) forms
const NIN_UK_RE = /^[A-Z]{2}\d{6}[A-D]$/;
const NIN_UK_PATTERN = /\b[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/gi;

const INVALID_PREFIXES = new Set(['BG', 'GB', 'KN', 'NK', 'NT', 'TN', 'ZZ']);

const ninUkDetector: PIIDetector = {
  id: 'nin-uk',
  label: 'UK National Insurance Number',
  category: PIICategory.GOV_ID,
  regions: ['GB'],
  pattern: NIN_UK_PATTERN,
  prefilter: /\d{2}/,

  detect(value) {
    const trimmed = value.replace(/\s/g, '').toUpperCase();
    if (!NIN_UK_RE.test(trimmed)) return false;
    // HMRC prefix rules: D, F, I, Q, U, V never used; O never second letter;
    // some combinations are reserved.
    if (/[DFIQUV]/.test(trimmed[0]!) || /[DFIOQUV]/.test(trimmed[1]!)) return false;
    return !INVALID_PREFIXES.has(trimmed.slice(0, 2));
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('NIN_UK', value, ctx, PIICategory.GOV_ID);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      // Valid-prefix letters only, so the fake passes the detector's own rules
      const first = 'ABCEGHJKLMNOPRSTWXYZ';
      const second = 'ABCEGHJKLMNPRSTWXYZ';
      const pick = (chars: string) => chars[randomInt(chars.length)]!;
      let prefix = pick(first) + pick(second);
      while (INVALID_PREFIXES.has(prefix)) prefix = pick(first) + pick(second);
      return `${prefix}${randomDigits(6)}${pick('ABCD')}`;
    }
    // Default mask
    const upper = value.replace(/\s/g, '').toUpperCase();
    return `XX-****-${upper.slice(-1)}`;
  },
};

registry.register(ninUkDetector);
