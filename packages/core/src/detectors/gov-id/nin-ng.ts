import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// NIN: exactly 11 digits (no spaces/dashes in canonical form)
const NIN_RE = /^\d{11}$/;

const ninNgDetector: PIIDetector = {
  id: 'nin-ng',
  label: 'Nigerian NIN',
  category: PIICategory.GOV_ID,
  regions: ['NG'],

  detect(value, key) {
    const trimmed = value.replace(/\s/g, '');
    const keyHint = key ? /\bnin\b|national.?id/i.test(key) : false;
    return keyHint ? NIN_RE.test(trimmed) : NIN_RE.test(trimmed);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('NIN', value, ctx, PIICategory.GOV_ID);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.string.numeric({ length: 11 }) ?? '[NIN]';
    }
    // Default mask: ***-***-8901
    return `***-***-${value.slice(-4)}`;
  },
};

registry.register(ninNgDetector);
