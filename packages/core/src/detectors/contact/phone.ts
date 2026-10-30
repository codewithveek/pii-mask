import { parsePhoneNumber, isValidPhoneNumber, isPossiblePhoneNumber } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';
import { normalizeKey } from '../utils';

// Countries to try when a number has no international prefix.
// Ordered roughly by population / likelihood of appearing in data.
// libphonenumber-js validates against each country's real numbering plan,
// so extra entries add negligible false-positive risk.
const FALLBACK_COUNTRIES: readonly CountryCode[] = [
  // Americas
  'US',
  'CA',
  'BR',
  'MX',
  // Europe
  'GB',
  'DE',
  'FR',
  'IT',
  'ES',
  // Africa
  'NG',
  'ZA',
  'KE',
  'GH',
  'EG',
  // South / South-East Asia
  'IN',
  'PK',
  'BD',
  'PH',
  'ID',
  // East Asia / Oceania
  'JP',
  'CN',
  'AU',
  'NZ',
];

// Matches phone numbers in freeform text:
//  1) International: +1 (415) 823-9042, +234 803 456 7890
//  2) US-style local: (415) 823-9042, 415-823-9042
//  3) Leading-zero local, compact or dash/dot only (NG, IN, ZA, DE …):
//     08034567890, 0803-456-7890, 0803.456.7890
//     Space-separated (0803 456 7890) is excluded — conflicts with SSN-US format.
// The boundaries stop a match from starting or ending inside a longer run of
// digits (timestamps, IDs), which would otherwise mask half a number.
const PHONE_PATTERN =
  /(?<![\w+])(?:\+\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}|\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}|0\d{2,4}[.-]?\d{3,4}[.-]?\d{3,5})(?!\w)/g;

// Only digits and phone punctuation; anything else can't be a phone number.
const PHONE_CHARS_RE = /^\+?[\d\s().-]+$/;
const HAS_SEPARATOR_RE = /[\s().-]/;

const PHONE_KEYS = new Set(['tel', 'cell', 'cellular', 'fax', 'msisdn', 'whatsapp']);
export function isPhoneKey(key: string): boolean {
  const k = normalizeKey(key);
  return PHONE_KEYS.has(k) || k.includes('phone') || k.includes('mobile') || k.endsWith('msisdn');
}

/** Try parsing with every fallback country; return the first success. */
function tryParse(value: string) {
  for (const country of FALLBACK_COUNTRIES) {
    try {
      return parsePhoneNumber(value, country);
    } catch {
      // next country
    }
  }
  return undefined;
}

const phoneDetector: PIIDetector = {
  id: 'phone-global',
  label: 'Phone Number',
  category: PIICategory.CONTACT,
  pattern: PHONE_PATTERN,
  prefilter: /\d{3}/,

  keyPattern: isPhoneKey,

  detect(value) {
    const trimmed = value.trim();
    if (trimmed.length < 7 || trimmed.length > 30) return false;
    if (!PHONE_CHARS_RE.test(trimmed)) return false;
    const digitCount = trimmed.replace(/\D/g, '').length;
    // E.164 numbers have at most 15 digits
    if (digitCount < 7 || digitCount > 15) return false;
    try {
      // International format (+prefix). The + is a strong signal, so a number
      // that is merely *possible* for its country (right length) is accepted.
      if (trimmed.startsWith('+')) {
        return isValidPhoneNumber(trimmed) || isPossiblePhoneNumber(trimmed);
      }

      // Local format with trunk prefix (0…) — common worldwide.
      // The leading 0 is a strong phone signal, try all fallback countries.
      if (trimmed.startsWith('0')) {
        for (const country of FALLBACK_COUNTRIES) {
          if (isValidPhoneNumber(trimmed, country)) return true;
        }
        return false;
      }

      // No + or 0 prefix — only NANP numbers (US/CA) are written without a
      // trunk prefix, and only when formatted (415-823-9042). A bare run of
      // digits is far more likely an ID or timestamp; under a phone-like key
      // it is still masked via keyPattern.
      if (!HAS_SEPARATOR_RE.test(trimmed)) return false;
      for (const country of ['US', 'CA'] as const) {
        if (isValidPhoneNumber(trimmed, country)) return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.phone.number({ style: 'international' }) ?? '[PHONE]';
    }
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('PHONE', value, ctx);
    }

    // Default: mask — preserve last 4 digits
    try {
      const parsed = parsePhoneNumber(value);
      const national = parsed.nationalNumber;
      return `***-***-${national.slice(-4)}`;
    } catch {
      const fallback = tryParse(value);
      if (fallback) {
        return `***-***-${fallback.nationalNumber.slice(-4)}`;
      }
      return `***-***-${value.slice(-4)}`;
    }
  },
};

registry.register(phoneDetector);
