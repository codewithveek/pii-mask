import type { PIIDetector } from '@/types';
import { PIICategory } from '@/types';
import { registry } from '@/registry';

// bcrypt hashes: $2a$, $2b$, or $2y$ prefix
// $2a$ / $2b$ / $2x$ / $2y$, two-digit cost, 22-char salt + 31-char hash in
// bcrypt's base64 alphabet.
const BCRYPT_RE = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const BCRYPT_PATTERN = /\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}(?![./A-Za-z0-9])/g;

const bcryptHashDetector: PIIDetector = {
  id: 'bcrypt-hash',
  label: 'bcrypt Hash',
  category: PIICategory.SECRET,
  pattern: BCRYPT_PATTERN,
  prefilter: /\$2/,

  detect(value) {
    return BCRYPT_RE.test(value.trim());
  },

  // Secrets are always fully redacted regardless of mode
  mask: () => '[REDACTED]',
};

registry.register(bcryptHashDetector);
