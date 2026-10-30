import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
// Negative lookbehinds avoid version strings ("v1.2.3.4", "version 1.2.3.4",
// "pkg@1.2.3.4") and fragments of longer dotted numbers (1.2.3.4.5).
const IPV4_PATTERN =
  /(?<!\bversion\s)(?<!\bv)(?<![\w.@])(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?!\.?\d|\w)/g;

const ipAddressDetector: PIIDetector = {
  id: 'ip-address',
  label: 'IPv4 Address',
  category: PIICategory.NETWORK,
  pattern: IPV4_PATTERN,
  prefilter: /\d\.\d/,

  detect(value) {
    const match = IPV4_RE.exec(value.trim());
    if (!match) return false;
    // Validate each octet is 0-255
    for (let i = 1; i <= 4; i++) {
      const octet = parseInt(match[i]!, 10);
      if (octet < 0 || octet > 255) return false;
    }
    return true;
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('IP', value, ctx, PIICategory.NETWORK);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.internet.ipv4() ?? '[IP]';
    }
    // Default mask: preserve first octet
    const parts = value.trim().split('.');
    return `${parts[0]}.***.***.***`;
  },
};

registry.register(ipAddressDetector);
