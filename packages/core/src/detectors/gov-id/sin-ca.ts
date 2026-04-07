import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// Canada Social Insurance Number: 9 digits in NNN-NNN-NNN or NNN NNN NNN format
const SIN_RE = /^\d{3}[\s-]\d{3}[\s-]\d{3}$/;
const SIN_PATTERN = /\b\d{3}[\s-]\d{3}[\s-]\d{3}\b/g;

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

const sinCaDetector: PIIDetector = {
  id: 'sin-ca',
  label: 'Canadian SIN',
  category: PIICategory.GOV_ID,
  regions: ['CA'],
  pattern: SIN_PATTERN,

  detect(value, key) {
    const trimmed = value.trim();
    if (!SIN_RE.test(trimmed)) return false;
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length !== 9) return false;
    // SIN cannot start with 0 or 8
    if (digits[0] === '0' || digits[0] === '8') return false;
    if (!luhn(digits)) return false;
    // Boost confidence with key hint
    const keyHint = key ? /\bsin\b|social.?insurance/i.test(key) : false;
    return keyHint || luhn(digits);
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
