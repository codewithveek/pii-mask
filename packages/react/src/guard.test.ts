import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('warnIfVulnerableReact', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['19.0.1', '19.2.0'])(
    'warns once (never throws) for affected React %s',
    async (version) => {
      vi.doMock('react', () => ({ default: { version }, version }));
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { warnIfVulnerableReact } = await import('./guard');
      expect(warnIfVulnerableReact()).toBe(true);
      expect(warnIfVulnerableReact()).toBe(true);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]![0]).toContain('CVE-2025-55182');
    },
  );

  it.each(['19.0.4', '19.2.4', '18.3.1'])('stays silent for React %s', async (version) => {
    vi.doMock('react', () => ({ default: { version }, version }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { warnIfVulnerableReact } = await import('./guard');
    expect(warnIfVulnerableReact()).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });
});
