import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync, mkdirSync, rmSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import { runMask } from './run.js';
import type { RunOptions } from './run.js';
import { resolveOptions } from './commands/mask.js';

const TMP = join(import.meta.dirname, '__run-tmp__');

beforeEach(() => mkdirSync(TMP, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

function collect() {
  const stream = new PassThrough();
  let text = '';
  stream.on('data', (c: Buffer) => (text += c.toString()));
  return { stream, text: () => text };
}

async function run(opts: Partial<RunOptions>, stdin = '') {
  const stdout = collect();
  const stderr = collect();
  await runMask(
    { mode: 'mask', ...opts },
    { stdin: Readable.from([stdin]), stdout: stdout.stream, stderr: stderr.stream },
  );
  return { stdout: stdout.text(), stderr: stderr.text() };
}

function file(name: string, content: string) {
  const path = join(TMP, name);
  writeFileSync(path, content);
  return path;
}

describe('CSV', () => {
  it('uses one session per file: the same value gets the same label in every row', async () => {
    const input = file('a.csv', 'name,email\nJane,jane@a.com\nBob,jane@a.com\nAl,al@b.com\n');
    await run({ file: input, mode: 'pseudonymize', output: join(TMP, 'out') });
    expect(readFileSync(join(TMP, 'out', 'a.csv'), 'utf-8')).toBe(
      'name,email\nJane,EMAIL_1\nBob,EMAIL_1\nAl,EMAIL_2\n',
    );
  });

  it('handles quoted multi-line cells, CRLF and BOM', async () => {
    const input = file('b.csv', '﻿name,note\r\nJane,"line one\r\nmail a@b.com"\r\n');
    await run({ file: input, mode: 'redact', output: join(TMP, 'out') });
    expect(readFileSync(join(TMP, 'out', 'b.csv'), 'utf-8')).toBe(
      'name,note\r\nJane,"line one\r\nmail [REDACTED]"\r\n',
    );
  });

  it('neutralizes masked cells that a spreadsheet would run as formulas', async () => {
    const input = file('c.csv', 'phone,note\n+14155552671,=SUM(A1)\n');
    await run({ file: input, mode: 'substitute', output: join(TMP, 'out') });
    const [, row] = readFileSync(join(TMP, 'out', 'c.csv'), 'utf-8')
      .trim()
      .split('\n');
    const [phone, note] = row!.split(',');
    // the substituted phone starts with "+" and is prefixed; untouched data is not
    expect(phone).toMatch(/^'\+/);
    expect(note).toBe('=SUM(A1)');
  });

  it('persists the token map for CSV input', async () => {
    const input = file('d.csv', 'email\na@b.com\n');
    const map = join(TMP, 'map.json');
    await run({ file: input, mode: 'tokenize', output: join(TMP, 'out'), tokenMapOut: map });
    const tokens = JSON.parse(readFileSync(map, 'utf-8')) as Record<string, string>;
    expect(Object.values(tokens)).toEqual(['a@b.com']);
  });
});

describe('JSONL and text', () => {
  it('streams JSONL with consistent labels and masks malformed lines as text', async () => {
    const input = file('a.jsonl', '{"e":"a@b.com"}\nnot json a@b.com\n{"e":"c@d.com"}\n');
    await run({ file: input, mode: 'pseudonymize', output: join(TMP, 'out') });
    expect(readFileSync(join(TMP, 'out', 'a.jsonl'), 'utf-8')).toBe(
      '{"e":"EMAIL_1"}\nnot json EMAIL_1\n{"e":"EMAIL_2"}\n',
    );
  });

  it('treats .ndjson and upper-case extensions by format', async () => {
    const input = file('A.NDJSON', '{"e":"a@b.com"}\n');
    await run({ file: input, mode: 'redact', output: join(TMP, 'out') });
    expect(readFileSync(join(TMP, 'out', 'A.NDJSON'), 'utf-8')).toBe('{"e":"[REDACTED]"}\n');
  });
});

describe('stdin format detection', () => {
  it('masks plain text from stdin', async () => {
    const { stdout } = await run({ mode: 'redact' }, 'plain log a@b.com\nnext\n');
    expect(stdout).toBe('plain log [REDACTED]\nnext\n');
  });

  it('masks NDJSON from stdin (e.g. piped pino output)', async () => {
    const { stdout } = await run({ mode: 'redact' }, '{"msg":"a@b.com"}\n{"msg":"c@d.com"}\n');
    expect(stdout).toBe('{"msg":"[REDACTED]"}\n{"msg":"[REDACTED]"}\n');
  });

  it('masks a pretty-printed JSON document from stdin', async () => {
    const { stdout } = await run({ mode: 'redact' }, '{\n  "email": "a@b.com"\n}\n');
    expect(JSON.parse(stdout)).toEqual({ email: '[REDACTED]' });
  });
});

describe('files and options', () => {
  it('writes the token map readable by the owner only', async () => {
    const input = file('a.json', '{"e":"a@b.com"}');
    const map = file('map.json', '{}');
    await run({ file: input, mode: 'tokenize', output: join(TMP, 'out'), tokenMapOut: map });
    expect(statSync(map).mode & 0o777).toBe(0o600);
  });

  it('masks in place atomically', async () => {
    const input = file('a.txt', 'mail a@b.com\n');
    await run({ file: input, mode: 'redact', inPlace: true });
    expect(readFileSync(input, 'utf-8')).toBe('mail [REDACTED]\n');
    expect(existsSync(join(TMP, `.a.txt.pii-mask-${process.pid}.tmp`))).toBe(false);
  });

  it('rejects an unknown format', async () => {
    await expect(run({ format: 'xml' as never })).rejects.toThrow(/Unknown format/);
  });

  it('report mode prints counts and writes nothing', async () => {
    const input = file('a.txt', 'a@b.com c@d.com\n');
    const { stderr } = await run({ file: input, report: true, output: join(TMP, 'out') });
    expect(stderr).toMatch(/email\s+2 instance/);
    expect(existsSync(join(TMP, 'out'))).toBe(false);
  });
});

describe('resolveOptions', () => {
  it('lets the config file set the mode when no flag is passed', () => {
    expect(resolveOptions({ mode: undefined }, { mode: 'redact' }).mode).toBe('redact');
  });

  it('lets a passed flag override the config file', () => {
    expect(resolveOptions({ mode: 'tokenize' }, { mode: 'redact' }).mode).toBe('tokenize');
  });

  it('rejects unknown modes', () => {
    expect(() => resolveOptions({ mode: 'blur' })).toThrow(/Unknown mode/);
  });

  it('accepts lists as comma strings or arrays', () => {
    const opts = resolveOptions({ disable: 'email, phone-global' }, { regions: ['NG', 'GB'] });
    expect(opts.disable).toEqual(['email', 'phone-global']);
    expect(opts.regions).toEqual(['NG', 'GB']);
  });
});
