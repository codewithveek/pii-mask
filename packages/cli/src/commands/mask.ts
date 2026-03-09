import { defineCommand } from 'citty';
import { resolve, extname, basename, join } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createMasker } from '@pii-mask/core';
import type { MaskMode } from '@pii-mask/core';
import { readStdin } from '../utils/stdin';
import { parseCSV, csvToString } from '../adapters/csv';
import { parseJSONL, jsonlToString } from '../adapters/jsonl';
import { persistTokenMap } from '../utils/token-map';

export const maskCommand = defineCommand({
  meta: { description: 'Mask PII in a file or stdin' },
  args: {
    file: { type: 'positional', required: false, description: 'Input file path' },
    mode: {
      type: 'string',
      default: 'mask',
      description: 'mask | redact | pseudonymize | tokenize | substitute',
    },
    output: { type: 'string', description: 'Output directory (default: ./masked-output)' },
    'in-place': { type: 'boolean', default: false, description: 'Overwrite input file' },
    format: { type: 'string', description: 'Force format: csv | json | jsonl | txt' },
    disable: { type: 'string', description: 'Comma-separated detector IDs to disable' },
    only: { type: 'string', description: 'Comma-separated categories or IDs to run' },
    'token-map-out': { type: 'string', description: 'File path to persist token map' },
    report: {
      type: 'boolean',
      default: false,
      description: 'Print detection report without masking',
    },
    config: { type: 'string', description: 'Path to .pii-mask.json config file' },
  },

  async run({ args }) {
    const config = args.config ? JSON.parse(readFileSync(resolve(args.config), 'utf-8')) : {};
    const opts = { ...config, ...args };

    const isStdin = !opts.file;
    let raw: string;

    if (isStdin) {
      try {
        raw = await readStdin();
      } catch {
        console.error('No file argument provided and stdin is a TTY.');
        process.exit(1);
      }
    } else {
      raw = readFileSync(resolve(opts.file as string), 'utf-8');
    }

    const format =
      (opts.format as string) ?? (isStdin ? 'json' : extname((opts.file as string) ?? '').slice(1));
    const masker = createMasker({
      mode: (opts.mode as MaskMode) ?? 'mask',
      disable: typeof opts.disable === 'string' ? opts.disable.split(',') : undefined,
      only: typeof opts.only === 'string' ? opts.only.split(',') : undefined,
    });

    let output: string;
    let allDetections: string[] = [];

    if (format === 'csv') {
      const { rows, headers } = parseCSV(raw);
      const masked = rows.map((row) => {
        return row.map((cell, i) => {
          const { result, detections } = masker.maskString(cell, headers[i]);
          allDetections.push(...detections);
          return result;
        });
      });
      output = csvToString([headers, ...masked]);
    } else if (format === 'jsonl') {
      const lines = parseJSONL(raw);
      const masked = lines.map((line) => {
        const { result, detections } = masker.maskObject(line);
        allDetections.push(...detections);
        return JSON.parse(result) as Record<string, unknown>;
      });
      output = jsonlToString(masked);
    } else if (format === 'json') {
      const data: unknown = JSON.parse(raw);
      const { result, detections, tokenMap } = Array.isArray(data)
        ? masker.maskArray(data as unknown[])
        : masker.maskObject(data as Record<string, unknown>);
      allDetections = detections;
      output = result;

      if (opts['token-map-out']) {
        await persistTokenMap(opts['token-map-out'] as string, tokenMap);
      }
    } else {
      // Plain text
      const { result, detections } = masker.maskString(raw);
      allDetections = detections;
      output = result;
    }

    if (opts.report) {
      const counts = allDetections.reduce<Record<string, number>>((acc, id) => {
        acc[id] = (acc[id] ?? 0) + 1;
        return acc;
      }, {});
      console.error('\n── PII Detection Report ──────────────────────');
      for (const [id, count] of Object.entries(counts)) {
        console.error(`  ${id.padEnd(20)} ${count} instance(s)`);
      }
      console.error('─────────────────────────────────────────────\n');
      return;
    }

    if (isStdin) {
      process.stdout.write(output);
      return;
    }

    if (opts['in-place']) {
      writeFileSync(resolve(opts.file as string), output, 'utf-8');
      console.error(`✓  Masked in place: ${opts.file}`);
      return;
    }

    const outDir = resolve((opts.output as string) ?? 'masked-output');
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, basename(opts.file as string));
    writeFileSync(outPath, output, 'utf-8');
    console.error(`✓  Masked output written to ${outPath}`);
  },
});
