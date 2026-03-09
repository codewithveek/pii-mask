import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// BVN: exactly 11 digits, distinguished from NIN by key hint
const BVN_RE = /^\d{11}$/;

const bvnNgDetector: PIIDetector = {
  id: 'bvn-ng',
  label: 'Nigerian BVN',
  category: PIICategory.GOV_ID,
  regions: ['NG'],

  detect(value, key) {
    const trimmed = value.replace(/\s/g, '');
    // Only fires when key name suggests BVN
    const keyHint = key ? /\bbvn\b|bank.?verif/i.test(key) : false;
    return keyHint && BVN_RE.test(trimmed);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('BVN', value, ctx, PIICategory.GOV_ID);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.string.numeric({ length: 11 }) ?? '[BVN]';
    }
    // Default mask
    return `***-***-${value.slice(-4)}`;
  },
};

registry.register(bvnNgDetector);
