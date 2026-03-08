import type { PIIDetector } from '../../types.js';
import { PIICategory, MaskMode } from '../../types.js';
import { registry } from '../../registry.js';
import { getOrCreateToken, getOrCreateLabel } from '../../engine.js';

const SSN_RE = /^\d{3}-\d{2}-\d{4}$/;

const ssnUsDetector: PIIDetector = {
  id: 'ssn-us',
  label: 'US Social Security Number',
  category: PIICategory.GOV_ID,
  regions: ['US'],

  detect(value, key) {
    const trimmed = value.trim();
    return SSN_RE.test(trimmed);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('SSN', value, ctx, PIICategory.GOV_ID);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.string.numeric({ length: 3 }) + '-' +
        ctx.faker?.string.numeric({ length: 2 }) + '-' +
        ctx.faker?.string.numeric({ length: 4 }) ?? '[SSN]';
    }
    // Default mask: ***-**-1234
    return `***-**-${value.slice(-4)}`;
  },
};

registry.register(ssnUsDetector);
