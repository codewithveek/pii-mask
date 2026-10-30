import type { PIIDetector } from '@/types';
import { PIICategory } from '@/types';
import { registry } from '@/registry';
import { normalizeKey } from '../utils';

// 32-char (MD5) or 64-char (SHA256) hex strings
const HEX_SECRET_RE = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{64}$/;

const NON_SECRET_HEX_KEY =
  /(?:trace|span|parent|request|correlation|transaction|commit|object|content|file|cache)(?:id|hash|sha)?$|etag|checksum|digest|integrity|^(?:sha\d*|md5|hash|crc\d*)$/;

const hexSecretDetector: PIIDetector = {
  id: 'hex-secret',
  label: 'Hex Secret (MD5/SHA256)',
  category: PIICategory.SECRET,

  // Hex digests are just as often identifiers — trace IDs, checksums, ETags,
  // commit hashes — so those keys are excluded.
  detect(value, key) {
    if (key !== undefined && NON_SECRET_HEX_KEY.test(normalizeKey(key))) return false;
    return HEX_SECRET_RE.test(value.trim());
  },

  // Secrets are always fully redacted regardless of mode
  mask: () => '[REDACTED]',
};

registry.register(hexSecretDetector);
