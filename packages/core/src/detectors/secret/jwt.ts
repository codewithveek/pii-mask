import type { PIIDetector } from '@/types';
import { PIICategory } from '@/types';
import { registry } from '@/registry';

// JWTs: three base64url segments separated by dots
const JWT_RE = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*$/;
// Freeform: a JWT header is base64url JSON, so it always starts with "eyJ"
// ('{"'). Anchoring on that keeps scanning linear on long dotted strings.
// The signature may be empty (alg "none").
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;

const jwtDetector: PIIDetector = {
  id: 'jwt',
  label: 'JSON Web Token',
  category: PIICategory.SECRET,
  pattern: JWT_PATTERN,
  prefilter: /eyJ/,

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
