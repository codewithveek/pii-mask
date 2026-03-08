import type { PIIDetector } from '../../types.js';
import { PIICategory } from '../../types.js';
import { registry } from '../../registry.js';

// 32-char (MD5) or 64-char (SHA256) hex strings
const HEX_SECRET_RE = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{64}$/;

const hexSecretDetector: PIIDetector = {
  id: 'hex-secret',
  label: 'Hex Secret (MD5/SHA256)',
  category: PIICategory.SECRET,

  detect(value) {
    return HEX_SECRET_RE.test(value.trim());
  },

  // Secrets are always fully redacted regardless of mode
  mask: () => '[REDACTED]',
};

registry.register(hexSecretDetector);
