import { useMemo } from 'react';
import { createMasker } from '@pii-mask/core';
import type { MaskMode, MaskResult } from '@pii-mask/core';

export interface UsePIIMaskOptions {
  mode?: MaskMode;
  detect?: string[];
  disable?: string[];
}

export interface UsePIIMaskReturn {
  masked: string;
  tokenMap: Record<string, string>;
  detections: string[];
  restore: (masked: string) => string;
}

export function usePIIMask(value: string, options: UsePIIMaskOptions = {}): UsePIIMaskReturn {
  const detectKey = options.detect?.join(',') ?? '';
  const disableKey = options.disable?.join(',') ?? '';
  const masker = useMemo(
    () =>
      createMasker({
        mode: options.mode ?? 'mask',
        ...(detectKey ? { only: detectKey.split(',') } : {}),
        ...(disableKey ? { disable: disableKey.split(',') } : {}),
      }),
    [options.mode, detectKey, disableKey],
  );

  const result: MaskResult = useMemo(() => masker.maskString(value), [masker, value]);

  return {
    masked: result.result,
    tokenMap: result.tokenMap,
    detections: result.detections,
    restore: (masked: string) => masker.restore(masked, result.tokenMap),
  };
}
