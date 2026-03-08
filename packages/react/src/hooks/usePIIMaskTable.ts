import { useMemo } from 'react';
import { createMasker } from '@pii-mask/core';
import type { MaskMode } from '@pii-mask/core';

export interface UsePIIMaskTableOptions<T> {
  /** Column keys to mask. If omitted, all string columns run through detectors. */
  maskColumns?: (keyof T)[];
  mode?: MaskMode;
  /** When true, returns original data untouched — for role-gated admin UIs. */
  reveal?: boolean;
  disable?: string[];
}

export interface UsePIIMaskTableReturn<T> {
  maskedData: T[];
}

export function usePIIMaskTable<T extends Record<string, unknown>>(
  data: T[],
  options: UsePIIMaskTableOptions<T> = {},
): UsePIIMaskTableReturn<T> {
  const masker = useMemo(
    () =>
      createMasker({
        mode: options.mode ?? 'mask',
        ...(options.disable != null && { disable: options.disable }),
      }),
    [options.mode, options.disable?.join(',')],
  );

  const maskedData = useMemo((): T[] => {
    if (options.reveal || data.length === 0) return data;

    return data.map((row) => {
      const out = { ...row };
      for (const key of Object.keys(row) as (keyof T)[]) {
        if (options.maskColumns && !options.maskColumns.includes(key)) continue;
        const val = row[key];
        if (typeof val === 'string') {
          out[key] = masker.maskString(val, key as string).result as T[keyof T];
        }
      }
      return out;
    });
  }, [data, masker, options.reveal, options.maskColumns?.join(',')]);

  return { maskedData };
}
