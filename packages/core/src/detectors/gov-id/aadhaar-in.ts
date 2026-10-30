import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';
import { normalizeKey } from '../utils';

// Aadhaar: 12 digits with Verhoeff checksum, never starting with 0 or 1.
// Usually printed as 4-4-4 groups (2341 2341 2346).
const AADHAAR_RE = /^[2-9]\d{11}$/;
const AADHAAR_GROUPED_RE = /^[2-9]\d{3}([\s-])\d{4}\1\d{4}$/;
// Freeform: grouped form anywhere, contiguous form only after "aadhaar"/"UID".
const AADHAAR_PATTERN =
  /(?<![\w-])[2-9]\d{3}([\s-])\d{4}\1\d{4}(?![\w-])|(?<=\b(?:aadhaa?r|uid)(?:\s+(?:no\.?|number))?\s*(?:is\s+|:\s*|#\s*)?)[2-9]\d{11}\b/gi;

function isAadhaarKey(key: string): boolean {
  const k = normalizeKey(key);
  return k.startsWith('aadhaar') || k.startsWith('aadhar') || k === 'uid' || k === 'uidai';
}

// Verhoeff algorithm tables
const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function verhoeff(num: string): boolean {
  let c = 0;
  const digits = num.split('').reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    const digit = digits[i];
    if (digit === undefined) return false;
    const pRow = p[i % 8];
    if (!pRow) return false;
    const pVal = pRow[digit];
    if (pVal === undefined) return false;
    const dRow = d[c];
    if (!dRow) return false;
    const dVal = dRow[pVal];
    if (dVal === undefined) return false;
    c = dVal;
  }
  return c === 0;
}

const aadhaarInDetector: PIIDetector = {
  id: 'aadhaar-in',
  label: 'Indian Aadhaar Number',
  category: PIICategory.GOV_ID,
  regions: ['IN'],
  // The contiguous form is only matched after an Aadhaar context word, which
  // detect() can't see, so matches are validated here instead.
  find(text) {
    const out: Array<{ start: number; end: number }> = [];
    for (const m of text.matchAll(AADHAAR_PATTERN)) {
      if (verhoeff(m[0].replace(/\D/g, '')))
        out.push({ start: m.index, end: m.index + m[0].length });
    }
    return out;
  },

  keyPattern: isAadhaarKey,
  prefilter: /\d{4}/,

  // About 1 in 10 random 12-digit numbers pass Verhoeff, so a bare 12-digit
  // value needs an Aadhaar-like key; the grouped 4-4-4 form stands on its own.
  detect(value, key) {
    const trimmed = value.trim();
    const digits = trimmed.replace(/[\s-]/g, '');
    if (!AADHAAR_RE.test(digits) || !verhoeff(digits)) return false;
    return AADHAAR_GROUPED_RE.test(trimmed) || (key !== undefined && isAadhaarKey(key));
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('AADHAAR', value, ctx, PIICategory.GOV_ID);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.string.numeric({ length: 12 }) ?? '[AADHAAR]';
    }
    // Default mask: XXXX-XXXX-1234
    const digits = value.replace(/\D/g, '');
    return `XXXX-XXXX-${digits.slice(-4)}`;
  },
};

registry.register(aadhaarInDetector);
