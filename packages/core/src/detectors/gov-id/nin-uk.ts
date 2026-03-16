import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// UK National Insurance Number: 2 letters, 6 digits, 1 letter (A-D)
// Both unspaced (AB123456C) and spaced (AB 12 34 56 C) forms
const NIN_UK_RE = /^[A-Z]{2}\d{6}[A-D]$/;
const NIN_UK_PATTERN = /\b[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/gi;

const ninUkDetector: PIIDetector = {
  id: 'nin-uk',
  label: 'UK National Insurance Number',
  category: PIICategory.GOV_ID,
  regions: ['UK'],
  pattern: NIN_UK_PATTERN,

  detect(value) {
    const trimmed = value.replace(/\s/g, '').toUpperCase();
    return NIN_UK_RE.test(trimmed);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('NIN_UK', value, ctx, PIICategory.GOV_ID);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const suffixes = 'ABCD';
      const randLetter = () => letters[Math.floor(Math.random() * 26)] ?? 'A';
      return (
        `${randLetter()}${randLetter()}` +
        `${ctx.faker?.string.numeric({ length: 6 }) ?? '000000'}` +
        `${suffixes[Math.floor(Math.random() * 4)] ?? 'A'}`
      );
    }
    // Default mask
    const upper = value.replace(/\s/g, '').toUpperCase();
    return `XX-****-${upper.slice(-1)}`;
  },
};

registry.register(ninUkDetector);
