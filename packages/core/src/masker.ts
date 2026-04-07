import { registry } from './registry';
import { walk, maskValue, maskText, createContext, extractTokenMap } from './engine';
import type { MaskOptions, MaskResult, MaskSession } from './types';
import { MaskMode } from './types';

export function createMasker(options: MaskOptions = {}) {
  const mode = options.mode ?? MaskMode.MASK;
  const keyNameOnly = options.keyNameOnly ?? false;
  const detectors = registry.resolve(options);

  function createSession(): MaskSession {
    return { _ctx: createContext(mode) };
  }

  function maskString(input: string, key?: string, session?: MaskSession): MaskResult {
    // When a session is provided, share tokenMap/counter but use fresh detections
    const ctx = session ? { ...session._ctx, detections: [] as string[] } : createContext(mode);

    // First try atomic detection (whole-value match)
    const { masked: atomicResult } = maskValue(input, key, detectors, ctx, keyNameOnly);
    // If atomic detection fired, use its result
    if (ctx.detections.length > 0) {
      return {
        result: atomicResult,
        tokenMap: extractTokenMap(ctx),
        detections: ctx.detections,
      };
    }
    // Otherwise, scan for inline PII using pattern-based detection
    const { masked: textResult } = maskText(input, detectors, ctx);
    return {
      result: textResult,
      tokenMap: extractTokenMap(ctx),
      detections: ctx.detections,
    };
  }

  function maskObject(input: Record<string, unknown>, session?: MaskSession): MaskResult {
    const ctx = session ? { ...session._ctx, detections: [] as string[] } : createContext(mode);
    const result = walk(input, undefined, detectors, ctx, keyNameOnly);
    return {
      result: JSON.stringify(result),
      tokenMap: extractTokenMap(ctx),
      detections: ctx.detections,
    };
  }

  function maskArray(input: unknown[], session?: MaskSession): MaskResult {
    const ctx = session ? { ...session._ctx, detections: [] as string[] } : createContext(mode);
    const result = walk(input, undefined, detectors, ctx, keyNameOnly);
    return {
      result: JSON.stringify(result),
      tokenMap: extractTokenMap(ctx),
      detections: ctx.detections,
    };
  }

  function detectString(input: string, key?: string): { detections: string[] } {
    const ctx = createContext(mode);
    maskValue(input, key, detectors, ctx, keyNameOnly);
    if (ctx.detections.length === 0) {
      maskText(input, detectors, ctx);
    }
    return { detections: [...ctx.detections] };
  }

  function restore(masked: string, tokenMap: Record<string, string>): string {
    let result = masked;
    for (const [token, original] of Object.entries(tokenMap)) {
      result = result.split(token).join(original);
    }
    return result;
  }

  function restoreObject(
    masked: string,
    tokenMap: Record<string, string>,
  ): Record<string, unknown> {
    const restored = restore(masked, tokenMap);
    return JSON.parse(restored) as Record<string, unknown>;
  }

  function restoreArray(masked: string, tokenMap: Record<string, string>): unknown[] {
    const restored = restore(masked, tokenMap);
    return JSON.parse(restored) as unknown[];
  }

  return {
    createSession,
    maskString,
    maskObject,
    maskArray,
    detectString,
    restore,
    restoreObject,
    restoreArray,
  };
}
