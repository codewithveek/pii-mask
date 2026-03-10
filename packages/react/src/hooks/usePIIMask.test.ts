import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePIIMask } from './usePIIMask';

describe('usePIIMask', () => {
  it('masks an email by default', () => {
    const { result } = renderHook(() => usePIIMask('test@example.com'));
    expect(result.current.masked).not.toBe('test@example.com');
    expect(result.current.detections).toContain('email');
  });

  it('returns original for non-PII text', () => {
    const { result } = renderHook(() => usePIIMask('Hello World'));
    expect(result.current.masked).toBe('Hello World');
    expect(result.current.detections).toHaveLength(0);
  });

  it('supports redact mode', () => {
    const { result } = renderHook(() => usePIIMask('test@example.com', { mode: 'redact' }));
    expect(result.current.masked).toBe('[REDACTED]');
  });

  it('supports tokenize mode with restore', () => {
    const { result } = renderHook(() => usePIIMask('test@example.com', { mode: 'tokenize' }));
    expect(result.current.masked).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    const restored = result.current.restore(result.current.masked);
    expect(restored).toBe('test@example.com');
  });

  it('respects disable option', () => {
    const { result } = renderHook(() => usePIIMask('test@example.com', { disable: ['email'] }));
    expect(result.current.masked).toBe('test@example.com');
    expect(result.current.detections).not.toContain('email');
  });

  it('respects detect option', () => {
    const { result } = renderHook(() => usePIIMask('123-45-6789', { detect: ['email'] }));
    // SSN should not be detected when only email is enabled
    expect(result.current.detections).not.toContain('ssn-us');
  });
});
