import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]!, 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

const creditCardDetector: PIIDetector = {
  id: 'credit-card',
  label: 'Credit / Debit Card',
  category: PIICategory.FINANCIAL,

  detect(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    return luhn(digits);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('CARD', value, ctx, PIICategory.FINANCIAL);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.finance.creditCardNumber() ?? '[CARD]';
    }
    const digits = value.replace(/\D/g, '');
    return `${digits.slice(0, 4)}-XXXX-XXXX-${digits.slice(-4)}`;
  },
};

registry.register(creditCardDetector);
