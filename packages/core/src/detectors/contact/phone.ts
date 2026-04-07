import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// Matches international phone numbers in freeform text:
// +1 (415) 823-9042, +44 7911 234567, +234 803 456 7890, etc.
// Also matches common local formats: (415) 823-9042, 415-823-9042, 415.823.9042
const PHONE_PATTERN =
  /(?:\+\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}|\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})/g;

const phoneDetector: PIIDetector = {
  id: 'phone-global',
  label: 'Phone Number',
  category: PIICategory.CONTACT,
  pattern: PHONE_PATTERN,

  detect(value) {
    const trimmed = value.trim();
    if (trimmed.length < 7 || trimmed.length > 30) return false;
    try {
      if (isValidPhoneNumber(trimmed)) return true;
      // Try common default countries for local numbers without country code
      for (const country of ['US', 'GB', 'CA'] as const) {
        if (isValidPhoneNumber(trimmed, country)) return true;
      }
      return false;
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
      try {
        const parsed = parsePhoneNumber(value, 'US');
        const national = parsed.nationalNumber;
        return `***-***-${national.slice(-4)}`;
      } catch {
        return `***-***-${value.slice(-4)}`;
      }
    }
  },
};

registry.register(phoneDetector);
