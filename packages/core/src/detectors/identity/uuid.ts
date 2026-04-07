import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel, generateToken } from '@/engine';

// UUID v1-v5: 8-4-4-4-12 hex format with version digit [1-5] and variant [89ab]
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

const uuidDetector: PIIDetector = {
  id: 'uuid',
  label: 'UUID',
  category: PIICategory.IDENTITY,
  pattern: UUID_PATTERN,

  detect(value) {
    return UUID_RE.test(value.trim());
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('UUID', value, ctx, PIICategory.IDENTITY);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      // Generate a plausible v4-shaped UUID from crypto
      const raw = generateToken()
        .replace(/[^a-f0-9]/g, '')
        .padEnd(32, '0');
      return [
        raw.slice(0, 8),
        raw.slice(8, 12),
        '4' + raw.slice(13, 16),
        '8' + raw.slice(17, 20),
        raw.slice(20, 32),
      ].join('-');
    }
    // Default mask: preserve first segment
    const parts = value.split('-');
    return `${parts[0]}-****-****-****-************`;
  },
};

registry.register(uuidDetector);
