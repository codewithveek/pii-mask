import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import type { PIIDetector } from '../../types.js';
import { PIICategory, MaskMode } from '../../types.js';
import { registry } from '../../registry.js';
import { getOrCreateToken, getOrCreateLabel } from '../../engine.js';

const phoneDetector: PIIDetector = {
  id: 'phone-global',
  label: 'Phone Number',
  category: PIICategory.CONTACT,

  detect(value) {
    if (value.length < 7 || value.length > 20) return false;
    try {
      return isValidPhoneNumber(value);
    } catch {
      return false;
    }
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.phone.number({ style: 'international' }) ?? '[PHONE]';
    }
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('PHONE', value, ctx);
    }

    // Default: mask
    try {
      const parsed = parsePhoneNumber(value);
      const national = parsed.nationalNumber;
      return `***-***-${national.slice(-4)}`;
    } catch {
      return `***-***-${value.slice(-4)}`;
    }
  },
};

registry.register(phoneDetector);
