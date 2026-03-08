import type { PIIDetector } from '../../types.js';
import { PIICategory } from '../../types.js';
import { registry } from '../../registry.js';

// bcrypt hashes: $2a$, $2b$, or $2y$ prefix
const BCRYPT_RE = /^\$2[aby]\$\d+\$.{53}$/;

const bcryptHashDetector: PIIDetector = {
  id: 'bcrypt-hash',
  label: 'bcrypt Hash',
  category: PIICategory.SECRET,

  detect(value) {
    return BCRYPT_RE.test(value.trim());
  },

  // Secrets are always fully redacted regardless of mode
  mask: () => '[REDACTED]',
};

registry.register(bcryptHashDetector);
