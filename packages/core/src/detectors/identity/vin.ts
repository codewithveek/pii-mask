import type { PIIDetector } from '@/types';
import { PIICategory, MaskMode } from '@/types';
import { registry } from '@/registry';
import { getOrCreateToken, getOrCreateLabel } from '@/engine';

// VIN: exactly 17 chars, excludes I, O, Q
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;
const VIN_PATTERN = /\b[A-HJ-NPR-Z0-9]{17}\b/g;

// VIN transliteration table (letters to numbers) for check-digit validation
const TRANSLITERATE: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
};

// Position weights for VIN check-digit calculation
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

function validateVIN(vin: string): boolean {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const ch = vin[i]!;
    const weight = WEIGHTS[i]!;
    const val = /\d/.test(ch) ? parseInt(ch, 10) : (TRANSLITERATE[ch] ?? 0);
    sum += val * weight;
  }
  const remainder = sum % 11;
  const check = remainder === 10 ? 'X' : String(remainder);
  return vin[8] === check;
}

const vinDetector: PIIDetector = {
  id: 'vin',
  label: 'Vehicle Identification Number',
  category: PIICategory.IDENTITY,
  pattern: VIN_PATTERN,

  detect(value) {
    const trimmed = value.trim().toUpperCase();
    if (!VIN_RE.test(trimmed)) return false;
    return validateVIN(trimmed);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('VIN', value, ctx, PIICategory.IDENTITY);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.vehicle.vin() ?? '[VIN]';
    }
    // Default mask: show first 3 chars (WMI) and last 6 (serial), mask middle
    return `${value.slice(0, 3)}${'*'.repeat(8)}${value.slice(-6)}`;
  },
};

registry.register(vinDetector);
