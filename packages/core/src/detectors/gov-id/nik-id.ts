import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// NIK (Indonesia): 16 digits, province code + DOB encoded
const NIK_RE = /^\d{16}$/;
const NIK_PATTERN = /\b\d{16}\b/g;

function hasValidProvince(value: string): boolean {
  const prov = parseInt(value.slice(0, 2), 10);
  // Indonesian province codes: 11–94
  return prov >= 11 && prov <= 94;
}

const nikIdDetector: PIIDetector = {
  id: 'nik-id',
  label: 'Indonesian NIK',
  category: PIICategory.GOV_ID,
  regions: ['ID'],
  pattern: NIK_PATTERN,

  detect(value) {
    const trimmed = value.replace(/\s/g, '');
    if (!NIK_RE.test(trimmed)) return false;
    return hasValidProvince(trimmed);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('NIK', value, ctx, PIICategory.GOV_ID);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.string.numeric({ length: 16 }) ?? '[NIK]';
    }
    // Default mask
    return `****-****-****-${value.slice(-4)}`;
  },
};

registry.register(nikIdDetector);
