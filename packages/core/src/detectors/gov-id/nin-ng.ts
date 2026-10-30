import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';
import { normalizeKey } from '../utils';

function isNinNgKey(key: string): boolean {
  const k = normalizeKey(key);
  return (
    /^nin(?:ng|number|no)?$/.test(k) ||
    ['nationalidentificationnumber', 'nationalid', 'nationalidnumber'].includes(k)
  );
}

// NIN: exactly 11 digits (no spaces/dashes in canonical form)
const NIN_RE = /^\d{11}$/;
// Freeform: match 11-digit sequences preceded by NIN/National Identification context
const NIN_NG_PATTERN =
  /(?<=(?:NIN|National\s+Identification\s+Number)\s+(?:is\s+|:\s*)?)\b\d{11}\b/gi;

const ninNgDetector: PIIDetector = {
  id: 'nin-ng',
  label: 'Nigerian NIN',
  category: PIICategory.GOV_ID,
  regions: ['NG'],
  pattern: NIN_NG_PATTERN,
  contextualPattern: true,
  prefilter: /\bnin\b|national\s+identification/i,

  keyPattern: isNinNgKey,

  // A bare 11-digit number is ambiguous (order IDs, phone numbers, BVNs), so
  // atomic detection needs a NIN key. Freeform text uses the context pattern.
  detect(value, key) {
    if (!key || !isNinNgKey(key)) return false;
    return NIN_RE.test(value.replace(/\s/g, ''));
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
