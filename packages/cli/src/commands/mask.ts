import { defineCommand } from 'citty';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { MaskMode } from '@pii-mask/core';
import { runMask } from '../run.js';
import type { Format, RunOptions } from '../run.js';

const ALLOWED_CONFIG_KEYS = new Set([
  'mode',
  'disable',
  'only',
  'regions',
  'key-name-only',
  'format',
  'output',
  'in-place',
  'token-map-out',
  'report',
]);

const MODES = new Set(['mask', 'redact', 'pseudonymize', 'anonymize', 'tokenize', 'substitute']);

export function loadConfig(path: string): Record<string, unknown> {
  const raw: unknown = JSON.parse(readFileSync(path, 'utf-8'));
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    console.error('Config file must be a JSON object');
    process.exit(1);
  }
  for (const key of Object.keys(raw as Record<string, unknown>)) {
    if (!ALLOWED_CONFIG_KEYS.has(key)) {
      console.error(`Warning: unknown config key "${key}" — ignored`);
    }
  }
  return raw as Record<string, unknown>;
}

/** Accepts "a,b" (CLI) or ["a","b"] (config file). */
function list(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}

/**
 * Merges config-file values with CLI flags. Only flags the user actually
 * passed override the config — defaults never do.
 */
export function resolveOptions(
  args: Record<string, unknown>,
  config: Record<string, unknown> = {},
): RunOptions {
  const passed = Object.fromEntries(
    Object.entries(args).filter(([k, v]) => v !== undefined && k !== '_'),
  );
  const o: Record<string, unknown> = { ...config, ...passed };
  const mode = String(o['mode'] ?? 'mask');
  if (!MODES.has(mode)) {
    throw new Error(`Unknown mode "${mode}". Expected one of: ${[...MODES].join(', ')}`);
  }
  const opts: RunOptions = { mode: mode as MaskMode };
  if (typeof o['file'] === 'string') opts.file = o['file'];
  if (typeof o['format'] === 'string') opts.format = o['format'].toLowerCase() as Format;
  if (typeof o['output'] === 'string') opts.output = o['output'];
  if (typeof o['token-map-out'] === 'string') opts.tokenMapOut = o['token-map-out'];
  if (o['in-place'] === true) opts.inPlace = true;
  if (o['report'] === true) opts.report = true;
  if (o['key-name-only'] === true) opts.keyNameOnly = true;
  const disable = list(o['disable']);
  const only = list(o['only']);
  const regions = list(o['regions']);
  if (disable) opts.disable = disable;
  if (only) opts.only = only;
  if (regions) opts.regions = regions;
  return opts;
}

export const maskCommand = defineCommand({
  meta: {
    name: 'pii-mask',
    description: 'Mask PII in CSV, JSON, JSONL, and TXT files (or stdin)',
  },
  args: {
    file: { type: 'positional', required: false, description: 'Input file path (default: stdin)' },
    mode: {
      type: 'string',
      description:
        'mask | redact | pseudonymize | anonymize | tokenize | substitute (default: mask)',
    },
    output: { type: 'string', description: 'Output directory (default: ./masked-output)' },
    'in-place': { type: 'boolean', description: 'Overwrite input file' },
    format: {
      type: 'string',
      description: 'Force format: csv | json | jsonl | txt (stdin is auto-detected)',
    },
    disable: { type: 'string', description: 'Comma-separated detector IDs to disable' },
    only: { type: 'string', description: 'Comma-separated categories or IDs to run' },
    regions: { type: 'string', description: 'Comma-separated ISO country codes, e.g. NG,GB' },
    'key-name-only': {
      type: 'boolean',
      description: 'Only mask fields whose key names them as sensitive',
    },
    'token-map-out': {
      type: 'string',
      description: 'File to persist the token map (contains raw PII; written with 0600)',
    },
    report: { type: 'boolean', description: 'Print detection report without masking' },
    config: { type: 'string', description: 'Path to .pii-mask.json config file' },
  },
  async run({ args }) {
    try {
      const config = args.config ? loadConfig(resolve(args.config)) : {};
      const { config: _config, ...rest } = args as Record<string, unknown>;
      const opts = resolveOptions(rest, config);
      if (!opts.file && process.stdin.isTTY) {
        throw new Error('No file argument provided and stdin is a TTY.');
      }
      await runMask(opts, { stdin: process.stdin, stdout: process.stdout, stderr: process.stderr });
    } catch (err) {
      console.error(`pii-mask: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  },
});
