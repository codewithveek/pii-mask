import type { PIIDetector } from '@/types';
import { PIICategory } from '@/types';
import { registry } from '@/registry';

// JWTs: three base64url segments separated by dots
const JWT_RE = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/;
const JWT_PATTERN = /\b[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b/g;

const jwtDetector: PIIDetector = {
  id: 'jwt',
  label: 'JSON Web Token',
  category: PIICategory.SECRET,
  pattern: JWT_PATTERN,

  detect(value) {
    if (!JWT_RE.test(value.trim())) return false;
    try {
      const headerB64 = value.split('.')[0]!.replace(/-/g, '+').replace(/_/g, '/');
      const header = JSON.parse(atob(headerB64));
      return typeof header === 'object' && header !== null && typeof header.alg === 'string';
    } catch {
      return false;
    }
  },

  // Secrets are always fully redacted regardless of mode
  mask: () => '[REDACTED]',
};

registry.register(jwtDetector);
