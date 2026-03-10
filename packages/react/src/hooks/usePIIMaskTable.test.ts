import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePIIMaskTable } from './usePIIMaskTable';

describe('usePIIMaskTable', () => {
  const sampleData = [
    { name: 'John Doe', email: 'john@example.com', age: '30' },
    { name: 'Jane Smith', email: 'jane@example.com', age: '25' },
  ];

  it('masks all string columns by default', () => {
    const { result } = renderHook(() => usePIIMaskTable(sampleData));
    const masked = result.current.maskedData;
    expect(masked[0]!.email).not.toBe('john@example.com');
    expect(masked[1]!.email).not.toBe('jane@example.com');
  });

  it('returns original data when reveal is true', () => {
    const { result } = renderHook(() => usePIIMaskTable(sampleData, { reveal: true }));
    expect(result.current.maskedData).toBe(sampleData);
  });

  it('returns empty array for empty data', () => {
    const { result } = renderHook(() => usePIIMaskTable([]));
    expect(result.current.maskedData).toEqual([]);
  });

  it('only masks specified columns', () => {
    const { result } = renderHook(() =>
      usePIIMaskTable(sampleData, { maskColumns: ['email'], mode: 'redact' }),
    );
    const masked = result.current.maskedData;
    expect(masked[0]!.email).toBe('[REDACTED]');
    // name column should be untouched since it's not in maskColumns
    expect(masked[0]!.name).toBe('John Doe');
  });

  it('supports redact mode', () => {
    const { result } = renderHook(() => usePIIMaskTable(sampleData, { mode: 'redact' }));
    const masked = result.current.maskedData;
    expect(masked[0]!.email).toBe('[REDACTED]');
  });

  it('respects disable option', () => {
    const { result } = renderHook(() => usePIIMaskTable(sampleData, { disable: ['email'] }));
    const masked = result.current.maskedData;
    // Email detector disabled, so email should stay the same
    expect(masked[0]!.email).toBe('john@example.com');
  });
});
