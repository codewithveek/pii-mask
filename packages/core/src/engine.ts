import { Faker, en } from '@faker-js/faker';
import { randomBytes } from 'node:crypto';
import type { PIIDetector, MaskContext } from '@/types';
import { MaskMode, PIICategory } from '@/types';

// ── Token / label helpers ──────────────────────────────────────────────────

export function generateToken(): string {
  return `<<PII_${randomBytes(4).toString('hex')}>>`;
}

export function getOrCreateToken(value: string, ctx: MaskContext): string {
  if (ctx.tokenMap.has(value)) return ctx.tokenMap.get(value)!;
  const token = generateToken();
  ctx.tokenMap.set(value, token);
  return token;
}

export function getOrCreateLabel(
  prefix: string,
  value: string,
  ctx: MaskContext,
  category: PIICategory = PIICategory.CONTACT,
): string {
  if (ctx.tokenMap.has(value)) return ctx.tokenMap.get(value)!;
  const count = (ctx.counter.get(category) ?? 0) + 1;
  ctx.counter.set(category, count);
  const label = `${prefix}_${count}`;
  ctx.tokenMap.set(value, label);
  return label;
}

// ── Unified recursive walker ────────────────────────────────────────────────

export function walk(
  node: unknown,
  key: string | undefined,
  detectors: PIIDetector[],
  ctx: MaskContext,
  keyNameOnly: boolean,
  seen = new WeakSet<object>(),
): unknown {
  // ── String — run detection ────────────────────────────────────────────────
  if (typeof node === 'string') {
    const { masked } = maskValue(node, key, detectors, ctx, keyNameOnly);
    return masked;
  }

  // ── Array — walk each item, pass parent key as hint ───────────────────────
  if (Array.isArray(node)) {
    if (seen.has(node)) return node;
    seen.add(node);
    return node.map((item) => walk(item, key, detectors, ctx, keyNameOnly, seen));
  }

  // ── Object — walk each value with its own key ─────────────────────────────
  if (node !== null && typeof node === 'object') {
    if (seen.has(node)) return node;
    seen.add(node);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] = walk(v, k, detectors, ctx, keyNameOnly, seen);
    }
    return out;
  }

  // ── Primitives (number, boolean, null, undefined) — pass through ──────────
  return node;
}

// ── Single-value masking (used by walk + public maskString) ────────────────

export function maskValue(
  value: string,
  key: string | undefined,
  detectors: PIIDetector[],
  ctx: MaskContext,
  keyNameOnly: boolean,
): { masked: string } {
  let masked = value;

  for (const detector of detectors) {
    if (keyNameOnly && !usesKeyHeuristic(detector)) continue;

    if (detector.detect(masked, key)) {
      masked = detector.mask(masked, ctx.mode, ctx);
      ctx.detections.push(detector.id);
      // Stop after first match — avoid double-masking
      break;
    }
  }

  return { masked };
}

function usesKeyHeuristic(detector: PIIDetector): boolean {
  return ['secret-key', 'person-name', 'address'].includes(detector.id);
}

// ── Freeform text scanning (used by public maskString) ─────────────────────

export function maskText(
  input: string,
  detectors: PIIDetector[],
  ctx: MaskContext,
): { masked: string } {
  let result = input;

  for (const detector of detectors) {
    if (!detector.pattern) continue;

    // Reset lastIndex — patterns must have the 'g' flag
    detector.pattern.lastIndex = 0;

    result = result.replace(detector.pattern, (match) => {
      // Run the atomic detect() as a secondary validation gate
      if (!detector.detect(match)) return match;

      ctx.detections.push(detector.id);
      return detector.mask(match, ctx.mode, ctx);
    });
  }

  return { masked: result };
}

export function createContext(mode: MaskMode): MaskContext {
  const ctx: MaskContext = {
    mode,
    counter: new Map(),
    tokenMap: new Map(),
    detections: [],
  };
  if (mode === MaskMode.SUBSTITUTE && !ctx.faker) {
    // faker is lazy-loaded only when substitute mode is active
    ctx.faker = new Faker({ locale: [en] });
  }
  return ctx;
}

export function extractTokenMap(ctx: MaskContext): Record<string, string> {
  // Invert: token → original (suitable for restore())
  const inverted: Record<string, string> = {};
  for (const [original, token] of ctx.tokenMap) {
    inverted[token] = original;
  }
  return inverted;
}
