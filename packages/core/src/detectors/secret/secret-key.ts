import type { PIIDetector } from '@/types';
import { PIICategory } from '@/types';
import { registry } from '@/registry';

const SECRET_KEY_RE =
  /^pin$|pass(?:word)?(?:hash)?$|hash$|secret|token|^api.?key$|private.?key|bearer/i;

const secretKeyDetector: PIIDetector = {
  id: 'secret-key',
  label: 'Secret / Credential',
  category: PIICategory.SECRET,

  detect(_value, key) {
    return key ? SECRET_KEY_RE.test(key) : false;
  },

  // Always fully redact regardless of mode
  mask: () => '[REDACTED]',
};

registry.register(secretKeyDetector);
