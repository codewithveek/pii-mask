import type { PIIDetector, MaskContext, FakerLike } from '@/types';
import { MaskMode, PIICategory } from '@/types';

// ── Randomness ──────────────────────────────────────────────────────────────
// Web Crypto is available in Node >= 19 and every modern browser, so core works
// in both without a `node:crypto` import or bundler shims.

// getRandomValues has a fixed per-call cost, so bytes are drawn from a pool.
const POOL_SIZE = 4096;
const pool = new Uint8Array(POOL_SIZE);
let poolOffset = POOL_SIZE;

function randomBytes(bytes: number): Uint8Array {
  if (bytes > POOL_SIZE) return globalThis.crypto.getRandomValues(new Uint8Array(bytes));
  if (poolOffset + bytes > POOL_SIZE) {
    globalThis.crypto.getRandomValues(pool);
    poolOffset = 0;
  }
  const out = pool.subarray(poolOffset, poolOffset + bytes);
  poolOffset += bytes;
  return out;
}

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

export function randomHex(bytes: number): string {
  let out = '';
  for (const b of randomBytes(bytes)) out += HEX[b];
  return out;
}

/** Uniform integer in [0, max). */
export function randomInt(max: number): number {
  const b = randomBytes(4);
  return (((b[0]! << 24) | (b[1]! << 16) | (b[2]! << 8) | b[3]!) >>> 0) % max;
}

// ── Token / label helpers ──────────────────────────────────────────────────

/** 64-bit random token. Collisions are additionally checked per token map. */
export function generateToken(): string {
  return `<<PII_${randomHex(8)}>>`;
}

// Tokens already issued for a given token map, so a collision can never map two
// originals to one token. Keyed by the Map itself because session contexts are
// shallow-copied per call while sharing the same tokenMap instance.
const issuedTokens = new WeakMap<Map<string, string>, Set<string>>();

export function getOrCreateToken(value: string, ctx: MaskContext): string {
  const existing = ctx.tokenMap.get(value);
  if (existing !== undefined) return existing;
  let issued = issuedTokens.get(ctx.tokenMap);
  if (!issued) {
    issued = new Set(ctx.tokenMap.values());
    issuedTokens.set(ctx.tokenMap, issued);
  }
  let token: string;
  do {
    token = generateToken();
  } while (issued.has(token));
  issued.add(token);
  ctx.tokenMap.set(value, token);
  return token;
}

/**
 * Returns a stable `PREFIX_N` label for `value`. Numbering is per prefix, so
 * emails and phones are numbered independently (`EMAIL_1`, `PHONE_1`).
 * The `category` parameter is accepted for backwards compatibility and unused.
 */
export function getOrCreateLabel(
  prefix: string,
  value: string,
  ctx: MaskContext,
  _category: PIICategory = PIICategory.CONTACT,
): string {
  const existing = ctx.tokenMap.get(value);
  if (existing !== undefined) return existing;
  const count = (ctx.counter.get(prefix) ?? 0) + 1;
  ctx.counter.set(prefix, count);
  const label = `${prefix}_${count}`;
  ctx.tokenMap.set(value, label);
  return label;
}

// ── Unified recursive walker ────────────────────────────────────────────────

export const DEFAULT_MAX_DEPTH = 100;

export function walk(
  node: unknown,
  key: string | undefined,
  detectors: PIIDetector[],
  ctx: MaskContext,
  keyNameOnly: boolean,
  ancestors: Set<object> = new Set(),
  depth = 0,
  maxDepth = DEFAULT_MAX_DEPTH,
): unknown {
  // ── String — atomic detection, then inline scanning ─────────────────────────
  if (typeof node === 'string') {
    return maskField(node, key, detectors, ctx, keyNameOnly);
  }

  // ── Numbers — masked only when the key says the field is sensitive ────────
  if (typeof node === 'number' || typeof node === 'bigint') {
    return maskNumber(node, key, detectors, ctx);
  }

  if (node === null || typeof node !== 'object') return node;

  // ── Containers ────────────────────────────────────────────────────────────
  // A credential container (e.g. `cookies: { sid: … }`) is redacted whole.
  const secret = key !== undefined ? secretDetectorForKey(key, detectors) : undefined;
  if (secret) {
    ctx.detections.push(secret.id);
    return secret.mask('', ctx.mode, ctx);
  }

  if (depth >= maxDepth) return '[Truncated]';
  // Only *ancestors* are tracked, so an object referenced twice (but not
  // cyclically) is masked at every occurrence.
  if (ancestors.has(node)) return '[Circular]';

  const recurse = (child: unknown, childKey: string | undefined) =>
    walk(child, childKey, detectors, ctx, keyNameOnly, ancestors, depth + 1, maxDepth);

  ancestors.add(node);
  try {
    if (node instanceof Error) return recurse(serializeError(node), key);

    if (Array.isArray(node)) return node.map((item) => recurse(item, key));

    if (node instanceof Map) {
      const entries = [...node.entries()];
      if (entries.every(([k]) => typeof k === 'string' || typeof k === 'number')) {
        return recurse(Object.fromEntries(entries), key);
      }
      return recurse(entries, key);
    }
    if (node instanceof Set) return recurse([...node], key);

    // Binary data (Buffer, typed arrays) is not text; pass through untouched.
    if (ArrayBuffer.isView(node) || node instanceof ArrayBuffer) return node;

    // Date, Buffer, bson ObjectId, Decimal, Mongoose documents …
    const toJSON = (node as { toJSON?: unknown }).toJSON;
    if (typeof toJSON === 'function') {
      const json: unknown = (toJSON as (k?: string) => unknown).call(node, key ?? '');
      if (json !== node) return recurse(json, key);
    }

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      const masked = recurse(v, k);
      if (k === '__proto__') {
        // Plain assignment would set the prototype and silently drop the key.
        Object.defineProperty(out, k, {
          value: masked,
          enumerable: true,
          writable: true,
          configurable: true,
        });
      } else {
        out[k] = masked;
      }
    }
    return out;
  } finally {
    ancestors.delete(node);
  }
}

/** Plain-object view of an Error, keeping the non-enumerable fields loggers need. */
export function serializeError(err: Error): Record<string, unknown> {
  const out: Record<string, unknown> = {
    type: err.constructor?.name ?? err.name,
    message: err.message,
    stack: err.stack,
  };
  for (const [k, v] of Object.entries(err)) out[k] = v;
  if ('cause' in err && err.cause !== undefined) out['cause'] = err.cause;
  return out;
}

function secretDetectorForKey(key: string, detectors: PIIDetector[]): PIIDetector | undefined {
  return detectors.find((d) => d.id === 'secret-key' && d.detect('', key));
}

function maskNumber(
  value: number | bigint,
  key: string | undefined,
  detectors: PIIDetector[],
  ctx: MaskContext,
): unknown {
  if (key === undefined) return value;
  const asString = String(value);
  const detector =
    secretDetectorForKey(key, detectors) ?? detectors.find((d) => matchesKeyPattern(d, key));
  if (!detector) return value;
  ctx.detections.push(detector.id);
  return detector.mask(asString, ctx.mode, ctx);
}

// ── Field masking: atomic detection with inline fallback ───────────────────

export function maskField(
  value: string,
  key: string | undefined,
  detectors: PIIDetector[],
  ctx: MaskContext,
  keyNameOnly: boolean,
): string {
  const before = ctx.detections.length;
  const { masked } = maskValue(value, key, detectors, ctx, keyNameOnly);
  if (ctx.detections.length > before) return masked;
  // keyNameOnly means no value-level pattern matching at all
  if (keyNameOnly) return value;
  return maskText(value, detectors, ctx).masked;
}

// ── Single-value masking ───────────────────────────────────────────────────

export function maskValue(
  value: string,
  key: string | undefined,
  detectors: PIIDetector[],
  ctx: MaskContext,
  keyNameOnly: boolean,
): { masked: string } {
  for (const detector of detectors) {
    if (keyNameOnly && !usesKeyHeuristic(detector)) continue;
    if (detector.detect(value, key)) {
      ctx.detections.push(detector.id);
      // Stop after first match — avoid double-masking
      return { masked: detector.mask(value, ctx.mode, ctx) };
    }
  }

  // No detector recognised the format, but the key names a sensitive type
  // (e.g. `ssn: '123456789'`, `vin: <non-checksummed VIN>`).
  if (key !== undefined && /\d/.test(value)) {
    const forced = detectors.find((d) => matchesKeyPattern(d, key));
    if (forced) {
      ctx.detections.push(forced.id);
      return { masked: forced.mask(value, ctx.mode, ctx) };
    }
  }

  return { masked: value };
}

function matchesKeyPattern(detector: PIIDetector, key: string): boolean {
  const { keyPattern } = detector;
  if (!keyPattern) return false;
  return typeof keyPattern === 'function' ? keyPattern(key) : keyPattern.test(key);
}

const KEY_HEURISTIC_DETECTORS = new Set(['secret-key', 'person-name', 'address']);

function usesKeyHeuristic(detector: PIIDetector): boolean {
  return KEY_HEURISTIC_DETECTORS.has(detector.id);
}

// ── Freeform text scanning ─────────────────────────────────────────────────

interface Candidate {
  start: number;
  end: number;
  priority: number;
  detector: PIIDetector;
}

/**
 * Finds PII inside freeform text. All detectors scan the *original* input, then
 * overlapping matches are resolved (longest wins, ties go to the detector
 * registered first) and replaced in one pass. Masked output is therefore never
 * re-scanned, and two detectors can never split one value between them.
 */
export function maskText(
  input: string,
  detectors: PIIDetector[],
  ctx: MaskContext,
): { masked: string } {
  const candidates: Candidate[] = [];

  detectors.forEach((detector, priority) => {
    const { pattern, prefilter } = detector;
    if (prefilter && !prefilter.test(input)) return;
    if (pattern) {
      // matchAll clones the regex, so the shared pattern's lastIndex is untouched
      const re = pattern.global ? pattern : new RegExp(pattern.source, pattern.flags + 'g');
      for (const match of input.matchAll(re)) {
        const text = match[0];
        if (!text) continue;
        // detect() is a secondary validation gate, except for contextual
        // patterns whose lookbehind already supplies the context detect() needs
        if (!detector.contextualPattern && !detector.detect(text)) continue;
        candidates.push({ start: match.index, end: match.index + text.length, priority, detector });
      }
    }
    if (detector.find) {
      for (const { start, end } of detector.find(input)) {
        if (end > start) candidates.push({ start, end, priority, detector });
      }
    }
  });

  if (candidates.length === 0) return { masked: input };

  candidates.sort((a, b) => a.start - b.start || b.end - a.end || a.priority - b.priority);
  const chosen: Candidate[] = [];
  for (const c of candidates) {
    const last = chosen[chosen.length - 1];
    if (!last || c.start >= last.end) {
      chosen.push(c);
      continue;
    }
    const cLen = c.end - c.start;
    const lastLen = last.end - last.start;
    if (cLen > lastLen || (cLen === lastLen && c.priority < last.priority)) {
      // c starts at or after last.start, so it can't overlap anything before last
      chosen[chosen.length - 1] = c;
    }
  }

  let out = '';
  let pos = 0;
  for (const c of chosen) {
    out += input.slice(pos, c.start);
    out += c.detector.mask(input.slice(c.start, c.end), ctx.mode, ctx);
    ctx.detections.push(c.detector.id);
    pos = c.end;
  }
  out += input.slice(pos);
  return { masked: out };
}

// ── Context / token map ─────────────────────────────────────────────────────

export function createContext(mode: MaskMode, faker?: FakerLike): MaskContext {
  const ctx: MaskContext = {
    mode,
    counter: new Map(),
    tokenMap: new Map(),
    detections: [],
  };
  if (mode === MaskMode.SUBSTITUTE && faker) ctx.faker = faker;
  return ctx;
}

/**
 * A result whose `tokenMap` is built only when first read: inverting a large
 * session map on every call would make long sessions quadratic.
 */
export function lazyResult<T>(value: T, ctx: MaskContext) {
  let tokenMap: Record<string, string> | undefined;
  const out = { result: value, detections: ctx.detections } as {
    result: T;
    tokenMap: Record<string, string>;
    detections: string[];
  };
  Object.defineProperty(out, 'tokenMap', {
    enumerable: true,
    configurable: true,
    get: () => (tokenMap ??= extractTokenMap(ctx)),
    set: (v: Record<string, string>) => {
      tokenMap = v;
    },
  });
  return out;
}

export function extractTokenMap(ctx: MaskContext): Record<string, string> {
  // Invert: token → original (suitable for restore())
  const inverted: Record<string, string> = {};
  for (const [original, token] of ctx.tokenMap) {
    inverted[token] = original;
  }
  return inverted;
}

// ── Restore ────────────────────────────────────────────────────────────────

// Matches every token/label this library generates: `<<PII_…>>` and `PREFIX_N`.
const GENERATED_TOKEN_SOURCE = String.raw`<<PII_[0-9a-f]+>>|\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_\d+\b`;
const GENERATED_TOKEN_FULL = new RegExp(`^(?:${GENERATED_TOKEN_SOURCE})$`);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replaces tokens/labels with their originals in a single pass. Whole tokens
 * are matched, so `EMAIL_1` never matches inside `EMAIL_10`.
 */
export function restoreString(masked: string, tokenMap: Record<string, string>): string {
  const keys = Object.keys(tokenMap);
  if (keys.length === 0) return masked;
  const re = keys.every((k) => GENERATED_TOKEN_FULL.test(k))
    ? new RegExp(GENERATED_TOKEN_SOURCE, 'g')
    : new RegExp(
        `(?:${keys
          .sort((a, b) => b.length - a.length)
          .map(escapeRegExp)
          .join('|')})(?![0-9])`,
        'g',
      );
  return masked.replace(re, (m) =>
    Object.prototype.hasOwnProperty.call(tokenMap, m) ? tokenMap[m]! : m,
  );
}

/** Restores every string inside an already-parsed value. */
export function restoreDeep(value: unknown, tokenMap: Record<string, string>): unknown {
  if (typeof value === 'string') return restoreString(value, tokenMap);
  if (Array.isArray(value)) return value.map((v) => restoreDeep(v, tokenMap));
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      Object.defineProperty(out, k, {
        value: restoreDeep(v, tokenMap),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return out;
  }
  return value;
}
