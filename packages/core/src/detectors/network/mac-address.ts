import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// MAC address: 6 groups of 2 hex chars separated by colons or dashes
const MAC_COLON_RE = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
const MAC_DASH_RE = /^([0-9A-Fa-f]{2}-){5}[0-9A-Fa-f]{2}$/;
const MAC_PATTERN = /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/g;

const macAddressDetector: PIIDetector = {
  id: 'mac-address',
  label: 'MAC Address',
  category: PIICategory.NETWORK,
  pattern: MAC_PATTERN,

  detect(value) {
    const trimmed = value.trim();
    return MAC_COLON_RE.test(trimmed) || MAC_DASH_RE.test(trimmed);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('MAC', value, ctx, PIICategory.NETWORK);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      const hex = () =>
        Math.floor(Math.random() * 256)
          .toString(16)
          .padStart(2, '0')
          .toUpperCase();
      const sep = value.includes(':') ? ':' : '-';
      return [hex(), hex(), hex(), hex(), hex(), hex()].join(sep);
    }
    // Default mask: preserve OUI (first 3 octets)
    const sep = value.includes(':') ? ':' : '-';
    const parts = value.split(/[:-]/);
    return `${parts[0]}${sep}${parts[1]}${sep}${parts[2]}${sep}XX${sep}XX${sep}XX`;
  },
};

registry.register(macAddressDetector);
