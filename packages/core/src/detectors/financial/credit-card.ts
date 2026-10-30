import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';
import { luhn, normalizeKey } from '../utils';

// Issuer (IIN) prefix and length rules. Requiring a real issuer range on top of
// Luhn rejects most numeric IDs and timestamps, ~10% of which pass Luhn alone.
export function isKnownCardNumber(d: string): boolean {
  const len = d.length;
  const p2 = parseInt(d.slice(0, 2), 10);
  const p3 = parseInt(d.slice(0, 3), 10);
  const p4 = parseInt(d.slice(0, 4), 10);
  const inLen = (min: number, max: number) => len >= min && len <= max;
  if (d[0] === '4') return len === 13 || len === 16 || len === 19; // Visa
  if ((p2 >= 51 && p2 <= 55) || (p4 >= 2221 && p4 <= 2720)) return len === 16; // Mastercard
  if (p2 === 34 || p2 === 37) return len === 15; // Amex
  if (p4 >= 2200 && p4 <= 2204) return inLen(16, 19); // Mir
  if (p4 >= 3528 && p4 <= 3589) return inLen(16, 19); // JCB
  if (p2 === 36 || p2 === 38 || p2 === 39 || (p3 >= 300 && p3 <= 305) || p3 === 309) {
    return inLen(14, 19); // Diners Club
  }
  // Discover (6011, 644-649, 65), UnionPay (62), RuPay (60, 81, 82), Maestro / Verve (50, 56-69)
  if (p2 === 50 || (p2 >= 56 && p2 <= 69) || p2 === 81 || p2 === 82) return inLen(12, 19);
  return false;
}

// Formatted card pattern: 4 groups of 4 digits separated by spaces or dashes
const CC_FORMATTED_RE = /^\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}$/;

// Contiguous digits, or the common printed groupings (4-4-4-4[-3], 4-6-5 Amex).
// Groups are fixed so separate adjacent numbers are never stitched together.
const CC_PATTERN =
  /(?<![\w-])(?:\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{3}|\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{1,4}|\d{4}[ -]\d{6}[ -]\d{4,5}|\d{12,19})(?![\w-])/g;

const creditCardDetector: PIIDetector = {
  id: 'credit-card',
  label: 'Credit / Debit Card',
  category: PIICategory.FINANCIAL,
  pattern: CC_PATTERN,
  prefilter: /\d{4}/,
  keyPattern: (key) =>
    /^(?:card|cardnumber|cardno|cardnum|creditcard|creditcardnumber|debitcard|ccnumber|pan)$/.test(
      normalizeKey(key),
    ),

  detect(value) {
    const trimmed = value.trim();
    // Reject strings that aren't card-like (must contain only digits, spaces, dashes)
    if (!/^[\d\s-]+$/.test(trimmed)) return false;
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 12 || digits.length > 19) return false;
    if (!isKnownCardNumber(digits)) return false;
    // Luhn-valid → definite card
    if (luhn(digits)) return true;
    // Printed like a card (4x4 groups) but mistyped → still treat as a card
    return CC_FORMATTED_RE.test(trimmed);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('CARD', value, ctx, PIICategory.FINANCIAL);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.finance.creditCardNumber() ?? '[CARD]';
    }
    const digits = value.replace(/\D/g, '');
    return `${digits.slice(0, 4)}-XXXX-XXXX-${digits.slice(-4)}`;
  },
};

registry.register(creditCardDetector);
