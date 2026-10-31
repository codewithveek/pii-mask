// Task checks for packages/cli/skills/mask-files.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import { createMasker } from '@pii-mask/core';
import { runMask } from './index.js';

const TMP = join(import.meta.dirname, '__skills-tmp__');
beforeEach(() => mkdirSync(TMP, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

const io = (stdin = '') => {
  const stdout = new PassThrough();
  let out = '';
  stdout.on('data', (c: Buffer) => (out += c.toString()));
  return { io: { stdin: Readable.from([stdin]), stdout, stderr: new PassThrough() }, out: () => out };
};

describe('skill: mask-files', () => {
  it('masks a CSV export by header and keeps it parseable', async () => {
    const file = join(TMP, 'users.csv');
    writeFileSync(file, 'name,ssn,plan\nJane Doe,123456789,pro\n');
    await runMask({ file, mode: 'redact', output: join(TMP, 'out') }, io().io);
    const csv = readFileSync(join(TMP, 'out', 'users.csv'), 'utf-8');
    expect(csv).not.toContain('123456789');
    expect(csv.trim().split('\n').map((l) => l.split(',').length)).toEqual([3, 3]);
  });

  it('tokenizes with a 0600 token map that restores the data', async () => {
    const file = join(TMP, 'a.jsonl');
    const map = join(TMP, 'tokens.json');
    writeFileSync(file, '{"email":"a@b.com"}\n');
    await runMask({ file, mode: 'tokenize', output: join(TMP, 'out'), tokenMapOut: map }, io().io);
    const masked = readFileSync(join(TMP, 'out', 'a.jsonl'), 'utf-8');
    const tokens = JSON.parse(readFileSync(map, 'utf-8')) as Record<string, string>;
    expect(masked).not.toContain('a@b.com');
    expect(statSync(map).mode & 0o777).toBe(0o600);
    expect(createMasker().restore(masked, tokens)).toBe('{"email":"a@b.com"}\n');
  });

  it('CSV on stdin needs --format csv for header-based masking', async () => {
    const csv = 'ssn\n123456789\n';
    const withFormat = io(csv);
    await runMask({ mode: 'redact', format: 'csv' }, withFormat.io);
    expect(withFormat.out()).not.toContain('123456789');
    // the mistake: no --format, so it is masked as text and the column name is lost
    const sniffed = io(csv);
    await runMask({ mode: 'redact' }, sniffed.io);
    expect(sniffed.out()).toContain('123456789');
  });
});
