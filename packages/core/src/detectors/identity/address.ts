import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// Key-name heuristic for addresses
const ADDRESS_KEY_RE = /\baddress\b|street|city|zip|postal|state|province/i;

const addressDetector: PIIDetector = {
  id: 'address',
  label: 'Physical Address',
  category: PIICategory.IDENTITY,

  detect(_value, key) {
    return key ? ADDRESS_KEY_RE.test(key) : false;
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('ADDRESS', value, ctx, PIICategory.IDENTITY);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.location.streetAddress({ useFullAddress: true }) ?? '[ADDRESS]';
    }
    // Default mask: show first few chars
    if (value.length <= 5) return '*'.repeat(value.length);
    return `${value.slice(0, 3)}${'*'.repeat(value.length - 3)}`;
  },
};

registry.register(addressDetector);
