import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';
import { isRealDate, luhn } from '../utils';

// South African ID: 13 digits, DOB encoded in first 6, Luhn check digit
const SAID_RE = /^\d{13}$/;
const SAID_PATTERN = /\b\d{13}\b/g;

// Layout: YYMMDD SSSS C A Z — date of birth, sequence, citizenship (0/1/2),
// a legacy digit, then a Luhn check digit.
function hasValidStructure(value: string): boolean {
  const yy = parseInt(value.slice(0, 2), 10);
  const mm = parseInt(value.slice(2, 4), 10);
  const dd = parseInt(value.slice(4, 6), 10);
  // The century is ambiguous; a date that's real in either one is accepted.
  if (!isRealDate(1900 + yy, mm, dd) && !isRealDate(2000 + yy, mm, dd)) return false;
  return value[10] === '0' || value[10] === '1' || value[10] === '2';
}

const saidZaDetector: PIIDetector = {
  id: 'said-za',
  label: 'South African ID Number',
  category: PIICategory.GOV_ID,
  regions: ['ZA'],
  pattern: SAID_PATTERN,
  prefilter: /\d{13}/,

  detect(value) {
    const trimmed = value.replace(/\s/g, '');
    if (!SAID_RE.test(trimmed)) return false;
    if (!hasValidStructure(trimmed)) return false;
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
