import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// PAN: 5 letters + 4 digits + 1 letter
const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;

const panInDetector: PIIDetector = {
  id: 'pan-in',
  label: 'Indian PAN',
  category: PIICategory.GOV_ID,
  regions: ['IN'],

  detect(value) {
    return PAN_RE.test(value.trim().toUpperCase());
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('PAN', value, ctx, PIICategory.GOV_ID);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randLetter = () => letters[Math.floor(Math.random() * 26)] ?? 'A';
      return (
        `${randLetter()}${randLetter()}${randLetter()}${randLetter()}${randLetter()}` +
        `${ctx.faker?.string.numeric({ length: 4 }) ?? '0000'}${randLetter()}`
      );
    }
    // Default mask: ABCX****Z
    const upper = value.trim().toUpperCase();
    return `${upper.slice(0, 3)}X****${upper.slice(-1)}`;
  },
};

registry.register(panInDetector);
