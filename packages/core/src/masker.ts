import { registry } from './registry';
import { walk, maskValue, createContext, extractTokenMap } from './engine';
import type { MaskOptions, MaskResult } from './types';
import { MaskMode } from './types';

export function createMasker(options: MaskOptions = {}) {
  const mode = options.mode ?? MaskMode.MASK;
  const keyNameOnly = options.keyNameOnly ?? false;
  const detectors = registry.resolve(options);

  function maskString(input: string, key?: string): MaskResult {
    const ctx = createContext(mode);
    const { masked } = maskValue(input, key, detectors, ctx, keyNameOnly);
    return {
      result: masked,
      tokenMap: extractTokenMap(ctx),
      detections: ctx.detections,
    };
  }

  function maskObject(input: Record<string, unknown>): MaskResult {
    const ctx = createContext(mode);
    const result = walk(input, undefined, detectors, ctx, keyNameOnly);
    return {
      result: JSON.stringify(result),
      tokenMap: extractTokenMap(ctx),
      detections: ctx.detections,
    };
  }

  function maskArray(input: unknown[]): MaskResult {
    const ctx = createContext(mode);
    const result = walk(input, undefined, detectors, ctx, keyNameOnly);
    return {
      result: JSON.stringify(result),
      tokenMap: extractTokenMap(ctx),
      detections: ctx.detections,
    };
  }

  function restore(masked: string, tokenMap: Record<string, string>): string {
    let result = masked;
    for (const [token, original] of Object.entries(tokenMap)) {
      result = result.split(token).join(original);
    }
    return result;
  }

  return { maskString, maskObject, maskArray, restore };
}
