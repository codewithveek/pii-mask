import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';
import { luhn, normalizeKey } from '../utils';

// Canada Social Insurance Number: 9 digits in NNN-NNN-NNN or NNN NNN NNN format
const SIN_RE = /^\d{3}[\s-]\d{3}[\s-]\d{3}$/;
const SIN_PATTERN = /\b\d{3}[\s-]\d{3}[\s-]\d{3}\b/g;

const sinCaDetector: PIIDetector = {
  id: 'sin-ca',
  label: 'Canadian SIN',
  category: PIICategory.GOV_ID,
  regions: ['CA'],
  pattern: SIN_PATTERN,
  prefilter: /\d{3}[\s-]\d{3}/,

  keyPattern: (key) => {
    const k = normalizeKey(key);
    return k === 'sin' || k === 'sinnumber' || k.startsWith('socialinsurance');
  },

  detect(value) {
    const trimmed = value.trim();
    if (!SIN_RE.test(trimmed)) return false;
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length !== 9) return false;
    // SIN cannot start with 0 or 8
    if (digits[0] === '0' || digits[0] === '8') return false;
    return luhn(digits);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('SIN', value, ctx, PIICategory.GOV_ID);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      const p1 = ctx.faker?.string.numeric({ length: 3 }) ?? '000';
      const p2 = ctx.faker?.string.numeric({ length: 3 }) ?? '000';
      const p3 = ctx.faker?.string.numeric({ length: 3 }) ?? '000';
      return `${p1}-${p2}-${p3}`;
    }
    // Default mask: ***-***-NNN
    return `***-***-${value.slice(-3)}`;
  },
};

registry.register(sinCaDetector);
