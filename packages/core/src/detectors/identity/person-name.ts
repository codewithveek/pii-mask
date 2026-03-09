import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// Key-name heuristic for person names
const PERSON_KEY_RE = /\bname\b|first.?name|last.?name|full.?name|surname/i;

const personNameDetector: PIIDetector = {
  id: 'person-name',
  label: 'Person Name',
  category: PIICategory.IDENTITY,

  detect(_value, key) {
    return key ? PERSON_KEY_RE.test(key) : false;
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('NAME', value, ctx, PIICategory.IDENTITY);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.person.fullName() ?? '[NAME]';
    }
    // Default mask: J*** D**
    const parts = value.split(' ');
    return parts
      .map((part) => {
        if (part.length <= 1) return part;
        return part[0] + '*'.repeat(part.length - 1);
      })
      .join(' ');
  },
};

registry.register(personNameDetector);
