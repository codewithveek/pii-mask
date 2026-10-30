import { useMemo } from 'react';
import { createMasker } from '@pii-mask/core';
import type { MaskMode } from '@pii-mask/core';

export interface UsePIIMaskTableOptions<T> {
  /** Column keys to mask. If omitted, every column runs through detectors. */
  maskColumns?: (keyof T)[];
  mode?: MaskMode;
  /**
   * When true, returns original data untouched — for role-gated admin UIs.
   * This is a display toggle, not access control: the raw data is already in
   * the browser.
   */
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
  const disableKey = options.disable?.join(',') ?? '';
  const masker = useMemo(
    () =>
      createMasker({
        mode: options.mode ?? 'mask',
        ...(disableKey ? { disable: disableKey.split(',') } : {}),
      }),
    [options.mode, disableKey],
  );

  const maskColumnsKey = options.maskColumns?.join(',') ?? '';
  const maskedData = useMemo((): T[] => {
    if (options.reveal || data.length === 0) return data;
    const maskCols = maskColumnsKey ? new Set(maskColumnsKey.split(',')) : null;
    // One session for the whole table, so a value gets the same
    // pseudonym/token in every row.
    const session = masker.createSession();

    return data.map((row) => {
      const selected: Record<string, unknown> = {};
      for (const key of Object.keys(row)) {
        if (!maskCols || maskCols.has(key)) selected[key] = row[key];
      }
      // Nested objects, arrays and numbers under sensitive keys are masked too
      const masked = masker.mask(selected, session).result;
      return { ...row, ...masked } as T;
    });
  }, [data, masker, options.reveal, maskColumnsKey]);

  return { maskedData };
}
