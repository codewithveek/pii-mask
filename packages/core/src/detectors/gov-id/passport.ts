import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// Passport numbers are 6-10 alphanumeric characters (varies by country)
const PASSPORT_RE = /^[A-Z0-9]{6,10}$/i;

// Freeform: lookbehind for "passport number" / "passport no" / "passport #"
// Allows intervening comma-separated clauses (e.g. "passport number, submitted during onboarding, is ...")
const PASSPORT_PATTERN =
  /(?<=passport\s+(?:number|no\.?|#)(?:(?:,\s*[a-z\s]+)*,)?\s*(?:is|was|:)\s*)\b[A-Z0-9]{6,10}\b/gi;

const PASSPORT_KEYS = /passport[-_ ]?(?:number|num|no|#|id)?/i;

const passportDetector: PIIDetector = {
  id: 'passport',
  label: 'Passport Number',
  category: PIICategory.GOV_ID,
  pattern: PASSPORT_PATTERN,
  contextualPattern: true,

  detect(value, key) {
    if (!key || !PASSPORT_KEYS.test(key)) return false;
    return PASSPORT_RE.test(value.trim());
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('PASSPORT', value, ctx, PIICategory.GOV_ID);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      const len = value.replace(/\s/g, '').length;
      return ctx.faker?.string.alphanumeric({ length: len }).toUpperCase() ?? '*'.repeat(len);
    }
    // Default mask: preserve length, show last 3
    const trimmed = value.replace(/\s/g, '');
    return `***${trimmed.slice(-3)}`;
  },
};

registry.register(passportDetector);
