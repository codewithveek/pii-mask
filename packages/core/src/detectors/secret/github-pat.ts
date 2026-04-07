import type { PIIDetector } from '@/types';
import { PIICategory } from '@/types';
import { registry } from '@/registry';

// GitHub PAT prefixes: ghp_ (personal), gho_ (OAuth), ghu_ (user-to-server),
// ghs_ (server-to-server), ghr_ (refresh)
const GH_PAT_RE = /^(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}$/;
const GH_PAT_PATTERN = /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/g;

const githubPatDetector: PIIDetector = {
  id: 'github-pat',
  label: 'GitHub Personal Access Token',
  category: PIICategory.SECRET,
  pattern: GH_PAT_PATTERN,

  detect(value) {
    return GH_PAT_RE.test(value.trim());
  },

  // Secrets are always fully redacted regardless of mode
  mask: () => '[REDACTED]',
};

registry.register(githubPatDetector);
