import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// CPF: 000.000.000-00 format with check digits
const CPF_RE = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const CPF_PATTERN = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;

function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  // Reject known invalid sequences
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // First check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]!, 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9]!, 10)) return false;

  // Second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]!, 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[10]!, 10)) return false;

  return true;
}

const cpfBrDetector: PIIDetector = {
  id: 'cpf-br',
  label: 'Brazilian CPF',
  category: PIICategory.GOV_ID,
  regions: ['BR'],
  pattern: CPF_PATTERN,

  detect(value) {
    const trimmed = value.trim();
    if (!CPF_RE.test(trimmed)) return false;
    return validateCPF(trimmed);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('CPF', value, ctx, PIICategory.GOV_ID);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return (
        `${ctx.faker?.string.numeric({ length: 3 }) ?? '000'}.` +
        `${ctx.faker?.string.numeric({ length: 3 }) ?? '000'}.` +
        `${ctx.faker?.string.numeric({ length: 3 }) ?? '000'}-` +
        `${ctx.faker?.string.numeric({ length: 2 }) ?? '00'}`
      );
    }
    // Default mask
    return `***.***.${value.slice(8, 11)}-**`;
  },
};

registry.register(cpfBrDetector);
