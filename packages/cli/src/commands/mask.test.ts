import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from './mask.js';

const TMP = join(import.meta.dirname, '__test-tmp__');

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('loadConfig', () => {
  it('loads a valid JSON config', () => {
    const file = join(TMP, 'valid.json');
    writeFileSync(file, JSON.stringify({ mode: 'redact', disable: 'email' }));
    const config = loadConfig(file);
    expect(config.mode).toBe('redact');
    expect(config.disable).toBe('email');
  });

  it('rejects non-object config (array)', () => {
    const file = join(TMP, 'array.json');
    writeFileSync(file, JSON.stringify(['a', 'b']));
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    expect(() => loadConfig(file)).toThrow('process.exit');
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
  });

  it('rejects non-object config (null)', () => {
    const file = join(TMP, 'null.json');
    writeFileSync(file, 'null');
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    expect(() => loadConfig(file)).toThrow('process.exit');
    exit.mockRestore();
  });

  it('warns about unknown config keys', () => {
    const file = join(TMP, 'unknown.json');
    writeFileSync(file, JSON.stringify({ mode: 'redact', badKey: true }));
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    const config = loadConfig(file);
    expect(config.mode).toBe('redact');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('badKey'));
    warn.mockRestore();
  });

  it('accepts all known config keys without warnings', () => {
    const file = join(TMP, 'all-keys.json');
    writeFileSync(
      file,
      JSON.stringify({
        mode: 'mask',
        disable: 'email',
        only: 'contact',
        format: 'json',
        output: './out',
        'in-place': false,
        'token-map-out': './tokens.json',
        report: true,
      }),
    );
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    loadConfig(file);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
