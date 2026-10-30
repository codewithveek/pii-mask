import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';
import { normalizeKey } from '../utils';

// Exact (normalized) keys. Substring matching is deliberately avoided:
// `city` would match capacity/opacity/velocity, `state` matches UI state.
const ADDRESS_KEYS = new Set([
  'address',
  'address1',
  'address2',
  'address3',
  'addressline',
  'addressline1',
  'addressline2',
  'addressline3',
  'street',
  'street1',
  'street2',
  'streetname',
  'streetaddress',
  'city',
  'town',
  'county',
  'province',
  'zip',
  'zipcode',
  'postcode',
  'postalcode',
]);
// `billing_city`, `shippingZip`, `home_street` …
const ADDRESS_PREFIXES = ['billing', 'shipping', 'home', 'mailing', 'delivery', 'residential'];
const ADDRESS_PARTS = [
  'address',
  'street',
  'city',
  'state',
  'zip',
  'zipcode',
  'postcode',
  'postalcode',
];
// Non-postal "…address" keys.
const NON_POSTAL_ADDRESS =
  /(?:ip|ipv4|ipv6|mac|email|mail|wallet|server|remote|local|bind|listen|proxy|host|contract|node|peer|broadcast|multicast|gateway|hardware|network|memory|web|url|base|socket|bitcoin|btc|eth|evm|return|reply)address$/;

export function isAddressKey(key: string): boolean {
  const k = normalizeKey(key);
  if (ADDRESS_KEYS.has(k)) return true;
  if (ADDRESS_PREFIXES.some((p) => ADDRESS_PARTS.some((part) => k === p + part))) return true;
  return k.endsWith('address') && !NON_POSTAL_ADDRESS.test(k);
}

const addressDetector: PIIDetector = {
  id: 'address',
  label: 'Physical Address',
  category: PIICategory.IDENTITY,
  // Numeric zip/postcodes are masked too
  keyPattern: isAddressKey,

  detect(_value, key) {
    return key ? isAddressKey(key) : false;
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('ADDRESS', value, ctx, PIICategory.IDENTITY);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.location.streetAddress({ useFullAddress: true }) ?? '[ADDRESS]';
    }
    // Default mask: show first few chars
    if (value.length <= 5) return '*'.repeat(value.length);
    return `${value.slice(0, 3)}${'*'.repeat(value.length - 3)}`;
  },
};

registry.register(addressDetector);
