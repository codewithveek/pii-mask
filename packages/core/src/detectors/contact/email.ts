import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

const EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;

const emailDetector: PIIDetector = {
  id: 'email',
  label: 'Email Address',
  category: PIICategory.CONTACT,

  detect: (value) => EMAIL_RE.test(value.trim()),

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.internet.email() ?? '[EMAIL]';
    }
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('EMAIL', value, ctx);
    }

    // Default mask: jo***n@domain.com
    const [local, domain] = value.split('@');
    if (!local || !domain) return '[EMAIL]';
    if (local.length <= 3) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 2)}${'*'.repeat(local.length - 3)}${local.slice(-1)}@${domain}`;
  },
};

registry.register(emailDetector);
