import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// BVN: exactly 11 digits, distinguished from NIN by key hint
const BVN_RE = /^\d{11}$/;
// Freeform: match 11-digit sequences preceded by BVN context
const BVN_NG_PATTERN =
  /(?<=(?:BVN|Bank\s+Verification(?:\s+Number)?)\s+(?:is\s+|:\s*)?)\b\d{11}\b/gi;

const bvnNgDetector: PIIDetector = {
  id: 'bvn-ng',
  label: 'Nigerian BVN',
  category: PIICategory.GOV_ID,
  regions: ['NG'],
  pattern: BVN_NG_PATTERN,
  contextualPattern: true,

  detect(value, key) {
    const trimmed = value.replace(/\s/g, '');
    if (!BVN_RE.test(trimmed)) return false;
    // Only fires when key name suggests BVN
    const keyHint = key ? /\bbvn\b|bank.?verif/i.test(key) : false;
    return keyHint;
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
