import type { PIIDetector } from '@/types';
import { PIICategory } from '@/types';
import { registry } from '@/registry';

// AWS Access Key ID: starts with AKIA (long-term) or ASIA (temporary STS)
const AWS_ACCESS_KEY_RE = /^(AKIA|ASIA)[A-Z0-9]{16}$/;
const AWS_ACCESS_KEY_PATTERN = /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g;

const awsKeyDetector: PIIDetector = {
  id: 'aws-key',
  label: 'AWS Access Key',
  category: PIICategory.SECRET,
  pattern: AWS_ACCESS_KEY_PATTERN,

  detect(value) {
    return AWS_ACCESS_KEY_RE.test(value.trim());
  },

  // Secrets are always fully redacted regardless of mode
  mask: () => '[REDACTED]',
};

registry.register(awsKeyDetector);
