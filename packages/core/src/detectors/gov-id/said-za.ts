import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// South African ID: 13 digits, DOB encoded in first 6, Luhn check digit
const SAID_RE = /^\d{13}$/;

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

function hasValidDOB(value: string): boolean {
  const yy = parseInt(value.slice(0, 2), 10);
  const mm = parseInt(value.slice(2, 4), 10);
  const dd = parseInt(value.slice(4, 6), 10);
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;
  return true;
}

const saidZaDetector: PIIDetector = {
  id: 'said-za',
  label: 'South African ID Number',
  category: PIICategory.GOV_ID,
  regions: ['ZA'],

  detect(value) {
    const trimmed = value.replace(/\s/g, '');
    if (!SAID_RE.test(trimmed)) return false;
    if (!hasValidDOB(trimmed)) return false;
    return luhn(trimmed);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('SAID', value, ctx, PIICategory.GOV_ID);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.string.numeric({ length: 13 }) ?? '[SAID]';
    }
    // Default mask
    return `***-****-${value.slice(-4)}`;
  },
};

registry.register(saidZaDetector);
