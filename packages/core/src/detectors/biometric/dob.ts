import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';
import { normalizeKey } from '../utils';

// Supports YYYY-MM-DD, MM/DD/YYYY and DD/MM/YYYY (also with . or - separators).
const DOB_MDY_RE = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
const DOB_ISO_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const DOB_DMY_RE = /^(0?[1-9]|[12]\d|3[01])([/.-])(0?[1-9]|1[0-2])\2\d{4}$/;

// Natural language months for freeform scanning
const MONTHS =
  'January|February|March|April|May|June|July|August|September|October|November|December';
const MONTHS_RE = new RegExp(`\\b(?:${MONTHS})\\b`, 'i');

// Birth-related context words — used in freeform lookbehind
const BIRTH_CONTEXT =
  '(?:born(?:\\s+on)?|birthday|date\\s+of\\s+birth|dob|birth\\s*date|d\\.o\\.b\\.?)';

const NUMERIC_DATE =
  '(?:\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])' +
  '|(?:0?[1-9]|[12]\\d|3[01])[/.-](?:0?[1-9]|1[0-2])[/.-]\\d{4}' +
  '|(?:0[1-9]|1[0-2])\\/(?:0[1-9]|[12]\\d|3[01])\\/\\d{4})';

// Natural language date sub-patterns (month-first and day-first)
const NATURAL_DATE =
  `(?:(?:${MONTHS})\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}` +
  '|' +
  `\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:${MONTHS}),?\\s+\\d{4})`;

// A date on its own is not a date of birth (createdAt, invoice dates, release
// notes …), so in freeform text every date form needs a birth-context word.
// The gap may not contain digits, so one context word can't claim a later date.
const DOB_PATTERN = new RegExp(
  `(?<=\\b${BIRTH_CONTEXT}\\b\\D{0,20})(?:\\b${NUMERIC_DATE}\\b|${NATURAL_DATE})`,
  'gi',
);

function isDobKey(key: string): boolean {
  const k = normalizeKey(key);
  return k === 'dob' || k.includes('birth') || k.endsWith('dob');
}

function isDateValue(value: string): boolean {
  if (DOB_ISO_RE.test(value) || DOB_MDY_RE.test(value) || DOB_DMY_RE.test(value)) return true;
  // Natural language date: "March 14, 1987", "22nd of July, 1993", etc.
  // Length-gate: a single date expression is at most ~30 chars
  return value.length <= 40 && MONTHS_RE.test(value) && /\d{4}/.test(value);
}

const dobDetector: PIIDetector = {
  id: 'dob',
  label: 'Date of Birth',
  category: PIICategory.BIOMETRIC,
  pattern: DOB_PATTERN,
  contextualPattern: true,
  prefilter: /born|birth|\bdob\b|d\.o\.b/i,
  keyPattern: isDobKey,

  // Only date-like values under a birth-related key are dates of birth.
  detect(value, key) {
    if (!key || !isDobKey(key)) return false;
    return isDateValue(value.trim());
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('DOB', value, ctx, PIICategory.BIOMETRIC);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      const date = ctx.faker?.date.birthdate();
      if (date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        if (DOB_ISO_RE.test(value.trim())) return `${y}-${m}-${d}`;
        if (DOB_MDY_RE.test(value.trim())) return `${m}/${d}/${y}`;
        const dmy = DOB_DMY_RE.exec(value.trim());
        if (dmy) return `${d}${dmy[2]}${m}${dmy[2]}${y}`;
        // Natural language: return "Month DD, YYYY"
        const monthNames = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];
        return `${monthNames[date.getMonth()]} ${date.getDate()}, ${y}`;
      }
      return '[DOB]';
    }
    // Default mask: show year only
    if (DOB_ISO_RE.test(value.trim())) {
      return `${value.trim().slice(0, 4)}-**-**`;
    }
    return `**/**/****`;
  },
};

registry.register(dobDetector);
