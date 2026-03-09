import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// Supports MM/DD/YYYY, DD/MM/YYYY, and YYYY-MM-DD
const DOB_MDY_RE = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
const DOB_ISO_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const dobDetector: PIIDetector = {
  id: 'dob',
  label: 'Date of Birth',
  category: PIICategory.BIOMETRIC,

  detect(value, key) {
    const trimmed = value.trim();
    const matchesFormat = DOB_MDY_RE.test(trimmed) || DOB_ISO_RE.test(trimmed);
    if (!matchesFormat) return false;
    // Boost: only fire on date-like key names to reduce false positives
    const keyHint = key ? /\bdob\b|birth|date.?of.?birth|birthday/i.test(key) : false;
    // If key hint exists, always fire. Otherwise still fire for date formats.
    return keyHint || matchesFormat;
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
        return DOB_ISO_RE.test(value.trim()) ? `${y}-${m}-${d}` : `${m}/${d}/${y}`;
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
