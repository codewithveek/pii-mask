import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// IBAN: 2 letter country code + 2 check digits + up to 30 alphanumeric BBAN
const IBAN_RE = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;
// Freeform: compact or printed in groups of four (GB82 WEST 1234 5698 7654 32).
const IBAN_CANDIDATE = /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,4})?\b/g;

/**
 * A spaced candidate can swallow a following upper-case word ("… 32 THEN"), so
 * trailing groups are dropped one at a time until the checksum validates.
 */
function findIbans(text: string): Array<{ start: number; end: number }> {
  const found: Array<{ start: number; end: number }> = [];
  for (const m of text.matchAll(IBAN_CANDIDATE)) {
    let candidate = m[0];
    while (candidate.length >= 15) {
      const compact = candidate.replace(/ /g, '');
      if (IBAN_RE.test(compact) && validateIBAN(compact)) {
        found.push({ start: m.index, end: m.index + candidate.length });
        break;
      }
      const lastSpace = candidate.lastIndexOf(' ');
      if (lastSpace <= 4) break;
      candidate = candidate.slice(0, lastSpace);
    }
  }
  return found;
}

function validateIBAN(iban: string): boolean {
  // Move first 4 chars to end, convert letters to numbers (A=10, B=11...)
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0);
      // A-Z: 65-90 → 10-35
      if (code >= 65 && code <= 90) return (code - 55).toString();
      return ch;
    })
    .join('');

  // mod97 on potentially very large number — process in chunks
  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder * 10 + parseInt(numeric[i]!, 10)) % 97;
  }
  return remainder === 1;
}

const ibanDetector: PIIDetector = {
  id: 'iban',
  label: 'IBAN',
  category: PIICategory.FINANCIAL,
  find: findIbans,

  detect(value) {
    const trimmed = value.replace(/\s/g, '').toUpperCase();
    if (!IBAN_RE.test(trimmed)) return false;
    return validateIBAN(trimmed);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('IBAN', value, ctx, PIICategory.FINANCIAL);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.finance.iban() ?? '[IBAN]';
    }
    // Default mask: keep country code, mask the rest
    const trimmed = value.replace(/\s/g, '').toUpperCase();
    return `${trimmed.slice(0, 4)}${'*'.repeat(trimmed.length - 8)}${trimmed.slice(-4)}`;
  },
};

registry.register(ibanDetector);
