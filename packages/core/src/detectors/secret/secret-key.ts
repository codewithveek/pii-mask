import type { PIIDetector } from '@/types';
import { PIICategory } from '@/types';
import { registry } from '@/registry';
import { normalizeKey } from '../utils';

// Keys are normalized first (`X-Api-Key` → `xapikey`, `refresh_token` → `refreshtoken`).
const EXACT = new Set([
  'pin',
  'pincode',
  'otp',
  'cvv',
  'cvv2',
  'cvc',
  'pass',
  'pwd',
  'passwd',
  'auth',
  'authorization',
  'proxyauthorization',
  'cookie',
  'cookies',
  'setcookie',
  'bearer',
  'jwt',
  'sid',
  'session',
  'apikey',
  'xapikey',
  'apisecret',
  'secret',
  'secrets',
  'token',
  'credential',
  'credentials',
  'connectionstring',
  'databaseurl',
  'dsn',
  'mfacode',
  'securitycode',
]);

const SUFFIXES = [
  'password',
  'passwd',
  'passphrase',
  'secret',
  'token',
  'apikey',
  'privatekey',
  'accesskey',
  'secretkey',
  'signingkey',
  'encryptionkey',
  'sessionid',
  'cookie',
  'credential',
  'credentials',
];

const PREFIXES = ['password', 'passwd', 'privatekey'];

export function isSecretKey(key: string): boolean {
  const k = normalizeKey(key);
  if (!k) return false;
  if (EXACT.has(k)) return true;
  if (SUFFIXES.some((s) => k.endsWith(s))) return true;
  return PREFIXES.some((p) => k.startsWith(p));
}

const secretKeyDetector: PIIDetector = {
  id: 'secret-key',
  label: 'Secret / Credential',
  category: PIICategory.SECRET,

  detect(_value, key) {
    return key ? isSecretKey(key) : false;
  },

  // Always fully redact regardless of mode
  mask: () => '[REDACTED]',
};

registry.register(secretKeyDetector);
