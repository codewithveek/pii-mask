import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('assertSafeReactVersion', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('throws for blocked React version 19.0.1', async () => {
    vi.doMock('react', () => ({ default: { version: '19.0.1' }, version: '19.0.1' }));
    const { assertSafeReactVersion } = await import('./guard');
    expect(() => assertSafeReactVersion()).toThrow('critical security vulnerabilities');
  });

  it('throws for blocked React version 19.2.0', async () => {
    vi.doMock('react', () => ({ default: { version: '19.2.0' }, version: '19.2.0' }));
    const { assertSafeReactVersion } = await import('./guard');
    expect(() => assertSafeReactVersion()).toThrow('CVE-2025-55182');
  });

  it('does not throw for safe React version 19.0.4', async () => {
    vi.doMock('react', () => ({ default: { version: '19.0.4' }, version: '19.0.4' }));
    const { assertSafeReactVersion } = await import('./guard');
    expect(() => assertSafeReactVersion()).not.toThrow();
  });

  it('does not throw for React 18', async () => {
    vi.doMock('react', () => ({ default: { version: '18.3.1' }, version: '18.3.1' }));
    const { assertSafeReactVersion } = await import('./guard');
    expect(() => assertSafeReactVersion()).not.toThrow();
  });
});
