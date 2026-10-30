/** Luhn (mod 10) checksum over a string of digits. */
export function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/**
 * Lower-cases a key and strips separators so `first_name`, `firstName` and
 * `First-Name` all compare equal (`firstname`).
 */
// Keys repeat constantly (every log line has the same fields), so normalized
// forms are memoized. The cache is reset when it grows large so arbitrary
// user-controlled keys can't grow it without bound.
const normalized = new Map<string, string>();

export function normalizeKey(key: string): string {
  let k = normalized.get(key);
  if (k === undefined) {
    if (normalized.size > 10_000) normalized.clear();
    k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    normalized.set(key, k);
  }
  return k;
}

/** True when `yyyy`/`mm`/`dd` form a real calendar date. */
export function isRealDate(yyyy: number, mm: number, dd: number): boolean {
  if (mm < 1 || mm > 12 || dd < 1) return false;
  const daysInMonth = new Date(Date.UTC(yyyy, mm, 0)).getUTCDate();
  return dd <= daysInMonth;
}

/** `length` random decimal digits. */
export function randomDigits(length: number): string {
  const buf = new Uint8Array(length);
  globalThis.crypto.getRandomValues(buf);
  let out = '';
  for (const b of buf) out += String(b % 10);
  return out;
}
