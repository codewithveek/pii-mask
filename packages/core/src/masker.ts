import { registry } from './registry';
import {
  walk,
  maskField,
  maskValue,
  maskText,
  createContext,
  extractTokenMap,
  lazyResult,
  restoreString,
  restoreDeep,
  DEFAULT_MAX_DEPTH,
} from './engine';
import type { MaskContext, MaskOptions, MaskResult, MaskSession } from './types';
import { MaskMode } from './types';

const VALID_MODES = new Set<string>(Object.values(MaskMode));

/** Result of `mask()`: the masked value keeps its structure instead of being stringified. */
export interface MaskValueResult<T> {
  result: T;
  tokenMap: Record<string, string>;
  detections: string[];
}

/** JSON.stringify that never throws on BigInt. */
function stringify(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) => (typeof v === 'bigint' ? v.toString() : v));
}

export function createMasker(options: MaskOptions = {}) {
  const mode = options.mode ?? MaskMode.MASK;
  if (!VALID_MODES.has(mode)) {
    throw new Error(
      `[pii-mask] Unknown mode "${String(mode)}". Expected one of: ${[...VALID_MODES].join(', ')}`,
    );
  }
  if (mode === MaskMode.SUBSTITUTE && !options.faker) {
    throw new Error(
      `[pii-mask] mode "substitute" needs a faker instance. Install @faker-js/faker and pass it in:\n` +
        `  import { faker } from '@faker-js/faker';\n` +
        `  createMasker({ mode: 'substitute', faker });`,
    );
  }
  const keyNameOnly = options.keyNameOnly ?? false;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const detectors = registry.resolve(options);

  function createSession(): MaskSession {
    return { _ctx: createContext(mode, options.faker) };
  }

  // When a session is provided, share tokenMap/counter but use fresh detections
  function contextFor(session?: MaskSession): MaskContext {
    return session
      ? { ...session._ctx, detections: [] as string[] }
      : createContext(mode, options.faker);
  }

  function result<T>(value: T, ctx: MaskContext): MaskValueResult<T> {
    return lazyResult(value, ctx);
  }

  function maskString(input: string, key?: string, session?: MaskSession): MaskResult {
    const ctx = contextFor(session);
    return result(maskField(input, key, detectors, ctx, keyNameOnly), ctx);
  }

  /**
   * Masks any value — object, array, string, Error, Map … — and returns the
   * masked copy with its structure intact (no JSON round-trip). Cycles become
   * `'[Circular]'`, Dates become ISO strings, Errors become plain objects.
   */
  function mask<T>(input: T, session?: MaskSession): MaskValueResult<T> {
    const ctx = contextFor(session);
    const masked = walk(input, undefined, detectors, ctx, keyNameOnly, new Set(), 0, maxDepth);
    return result(masked as T, ctx);
  }

  /** Masks an object and returns the result serialized as JSON. */
  function maskObject(input: Record<string, unknown>, session?: MaskSession): MaskResult {
    const r = mask(input, session);
    r.result = stringify(r.result) as unknown as Record<string, unknown>;
    return r as unknown as MaskResult;
  }

  /** Masks an array and returns the result serialized as JSON. */
  function maskArray(input: unknown[], session?: MaskSession): MaskResult {
    const r = mask(input, session);
    r.result = stringify(r.result) as unknown as unknown[];
    return r as unknown as MaskResult;
  }

  function detectString(input: string, key?: string): { detections: string[] } {
    const ctx = createContext(mode, options.faker);
    maskValue(input, key, detectors, ctx, keyNameOnly);
    if (ctx.detections.length === 0 && !keyNameOnly) {
      maskText(input, detectors, ctx);
    }
    return { detections: [...ctx.detections] };
  }

  /** Token map (token → original) accumulated by a session so far. */
  function getTokenMap(session: MaskSession): Record<string, string> {
    return extractTokenMap(session._ctx);
  }

  function restore(masked: string, tokenMap: Record<string, string>): string {
    return restoreString(masked, tokenMap);
  }

  /** Restores every string inside a value returned by `mask()`. */
  function restoreValue<T>(masked: T, tokenMap: Record<string, string>): T {
    return restoreDeep(masked, tokenMap) as T;
  }

  function restoreObject(
    masked: string,
    tokenMap: Record<string, string>,
  ): Record<string, unknown> {
    // Parse first, then restore: originals containing quotes or backslashes
    // would otherwise corrupt the JSON.
    return restoreDeep(JSON.parse(masked), tokenMap) as Record<string, unknown>;
  }

  function restoreArray(masked: string, tokenMap: Record<string, string>): unknown[] {
    return restoreDeep(JSON.parse(masked), tokenMap) as unknown[];
  }

  return {
    createSession,
    getTokenMap,
    mask,
    maskString,
    maskObject,
    maskArray,
    detectString,
    restore,
    restoreValue,
    restoreObject,
    restoreArray,
  };
}

export type Masker = ReturnType<typeof createMasker>;
