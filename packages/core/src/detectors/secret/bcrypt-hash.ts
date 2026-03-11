import type { PIIDetector } from '@/types';
import { PIICategory } from '@/types';
import { registry } from '@/registry';

// bcrypt hashes: $2a$, $2b$, or $2y$ prefix
const BCRYPT_RE = /^\$2[aby]\$\d+\$.{53}$/;
const BCRYPT_PATTERN = /\$2[aby]\$\d+\$.{53}/g;

const bcryptHashDetector: PIIDetector = {
  id: 'bcrypt-hash',
  label: 'bcrypt Hash',
  category: PIICategory.SECRET,
  pattern: BCRYPT_PATTERN,

  detect(value) {
    return BCRYPT_RE.test(value.trim());
  },

  // Secrets are always fully redacted regardless of mode
  mask: () => '[REDACTED]',
};

registry.register(bcryptHashDetector);
