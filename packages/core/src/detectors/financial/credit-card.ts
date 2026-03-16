import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]!, 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// Common card prefix ranges: Visa (4), MC (51-55, 2221-2720), Amex (34,37), Discover (6011,65)
function hasCardPrefix(digits: string): boolean {
  const d = digits;
  if (d[0] === '4') return true; // Visa
  const two = parseInt(d.slice(0, 2), 10);
  if (two >= 51 && two <= 55) return true; // Mastercard
  if (two === 34 || two === 37) return true; // Amex
  const four = parseInt(d.slice(0, 4), 10);
  if (four >= 2221 && four <= 2720) return true; // Mastercard
  if (four === 6011 || d.slice(0, 2) === '65') return true; // Discover
  return false;
}

// Formatted card pattern: 4 groups of 4 digits separated by spaces or dashes
const CC_FORMATTED_RE = /^\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}$/;

// Matches 13-19 digit card numbers with optional spaces or dashes
const CC_PATTERN = /\b(?:\d[ -]*?){13,19}\b/g;

const creditCardDetector: PIIDetector = {
  id: 'credit-card',
  label: 'Credit / Debit Card',
  category: PIICategory.FINANCIAL,
  pattern: CC_PATTERN,

  detect(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    // Luhn-valid → definite card
    if (luhn(digits)) return true;
    // Formatted like a card (4x4 groups) with known card prefix → likely card
    if (CC_FORMATTED_RE.test(value.trim()) && hasCardPrefix(digits)) return true;
    return false;
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
