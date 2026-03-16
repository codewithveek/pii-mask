import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// Supports MM/DD/YYYY, DD/MM/YYYY, and YYYY-MM-DD
const DOB_MDY_RE = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
const DOB_ISO_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// Natural language months for freeform scanning
const MONTHS =
  'January|February|March|April|May|June|July|August|September|October|November|December';
// Matches: "March 14, 1987", "22nd of July, 1993", "November 3, 1990"
// Also matches numeric formats: MM/DD/YYYY, YYYY-MM-DD
const DOB_PATTERN = new RegExp(
  '\\b(?:' +
    // "Month DD, YYYY" or "Month DDth, YYYY"
    `(?:${MONTHS})\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}` +
    '|' +
    // "DD Month YYYY" or "DDth of Month, YYYY" or "DDth of Month YYYY"
    `\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:${MONTHS}),?\\s+\\d{4}` +
    '|' +
    // MM/DD/YYYY
    '(?:0[1-9]|1[0-2])\\/(0[1-9]|[12]\\d|3[01])\\/\\d{4}' +
    '|' +
    // YYYY-MM-DD
    '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])' +
    ')\\b',
  'gi',
);

const dobDetector: PIIDetector = {
  id: 'dob',
  label: 'Date of Birth',
  category: PIICategory.BIOMETRIC,
  pattern: DOB_PATTERN,

  detect(value, key) {
    const trimmed = value.trim();
    const matchesNumeric = DOB_MDY_RE.test(trimmed) || DOB_ISO_RE.test(trimmed);
    // Natural language date: "March 14, 1987", "22nd of July, 1993", etc.
    // Length-gate: a single date expression is at most ~30 chars
    const monthsRe =
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/i;
    const matchesNatural = trimmed.length <= 40 && monthsRe.test(trimmed) && /\d{4}/.test(trimmed);
    if (!matchesNumeric && !matchesNatural) return false;
    // Boost: only fire on date-like key names to reduce false positives
    const keyHint = key ? /\bdob\b|birth|date.?of.?birth|birthday/i.test(key) : false;
    return keyHint || matchesNumeric || matchesNatural;
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
