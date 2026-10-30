import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';
import { normalizeKey } from '../utils';

// Keys that unambiguously hold a person's name (normalized form).
const NAME_KEYS = new Set([
  'fname',
  'lname',
  'forename',
  'forenames',
  'surname',
  'fullname',
  'firstname',
  'lastname',
  'middlename',
  'givenname',
  'familyname',
  'maidenname',
  'legalname',
  'personname',
  'nameoncard',
  'accountholder',
  'accountholdername',
  'cardholder',
  'cardholdername',
]);
const NAME_SUFFIXES = ['firstname', 'lastname', 'fullname', 'middlename', 'surname', 'holdername'];
// A bare `name` key is ambiguous (product.name, pino's logger name …), so it
// only counts when the value itself looks like a person's name: 2–4 words,
// each starting with a capital letter.
const BARE_NAME_KEYS = new Set([
  'name',
  'customername',
  'contactname',
  'patientname',
  'employeename',
  'username',
  'displayname',
  'recipientname',
  'sendername',
  'billingname',
  'shippingname',
]);
const PERSON_LIKE_RE = /^\p{Lu}[\p{L}'’.-]*(?:\s+\p{Lu}[\p{L}'’.-]*){1,3}$/u;

export function isPersonNameField(value: string, key: string): boolean {
  const k = normalizeKey(key);
  if (NAME_KEYS.has(k) || NAME_SUFFIXES.some((s) => k.endsWith(s))) return true;
  return BARE_NAME_KEYS.has(k) && PERSON_LIKE_RE.test(value.trim());
}

const personNameDetector: PIIDetector = {
  id: 'person-name',
  label: 'Person Name',
  category: PIICategory.IDENTITY,

  detect(value, key) {
    return key ? isPersonNameField(value, key) : false;
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('NAME', value, ctx, PIICategory.IDENTITY);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.person.fullName() ?? '[NAME]';
    }
    // Default mask: J*** D**
    const parts = value.split(' ');
    return parts
      .map((part) => {
        if (part.length <= 1) return part;
        return part[0] + '*'.repeat(part.length - 1);
      })
      .join(' ');
  },
};

registry.register(personNameDetector);
