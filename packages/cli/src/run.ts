import { createReadStream, createWriteStream, renameSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, extname, basename, join, dirname } from 'node:path';
import type { Readable, Writable } from 'node:stream';
import { once } from 'node:events';
import { createMasker } from '@pii-mask/core';
import type { MaskMode, MaskOptions, MaskSession } from '@pii-mask/core';
import { parseCSV, csvToString, neutralizeFormula } from './adapters/csv.js';
import { readLines } from './utils/lines.js';
import { persistTokenMap } from './utils/token-map.js';

export type Format = 'csv' | 'json' | 'jsonl' | 'txt';

export interface RunOptions {
  file?: string;
  mode: MaskMode;
  format?: Format;
  output?: string;
  inPlace?: boolean;
  disable?: string[];
  only?: string[];
  regions?: string[];
  keyNameOnly?: boolean;
  tokenMapOut?: string;
  report?: boolean;
}

export interface RunIO {
  stdin: Readable;
  stdout: Writable;
  stderr: Writable;
}

const FORMATS = new Set<Format>(['csv', 'json', 'jsonl', 'txt']);

export function formatFromExtension(file: string): Format {
  const ext = extname(file).slice(1).toLowerCase();
  if (ext === 'csv') return 'csv';
  if (ext === 'json') return 'json';
  if (ext === 'jsonl' || ext === 'ndjson') return 'jsonl';
  return 'txt';
}

/** faker is an optional peer: only loaded for substitute mode. */
async function loadFaker(): Promise<unknown> {
  try {
    const mod = (await import('@faker-js/faker')) as { faker: unknown };
    return mod.faker;
  } catch {
    throw new Error(
      'mode "substitute" needs @faker-js/faker. Install it next to the CLI: npm i -g @faker-js/faker',
    );
  }
}

async function readText(input: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of input) chunks.push(Buffer.from(chunk as Buffer));
  return Buffer.concat(chunks).toString('utf-8');
}

/** Something that consumes masked output chunks. */
interface Sink {
  write(chunk: string): Promise<void>;
}

function streamSink(stream: Writable): Sink {
  return {
    async write(chunk) {
      if (!stream.write(chunk)) await once(stream, 'drain');
    },
  };
}

export async function runMask(opts: RunOptions, io: RunIO): Promise<void> {
  if (opts.format && !FORMATS.has(opts.format)) {
    throw new Error(`Unknown format "${opts.format}". Expected one of: csv, json, jsonl, txt`);
  }
  const maskerOpts: MaskOptions = { mode: opts.mode };
  if (opts.disable?.length) maskerOpts.disable = opts.disable;
  if (opts.only?.length) maskerOpts.only = opts.only;
  if (opts.regions?.length) maskerOpts.regions = opts.regions;
  if (opts.keyNameOnly) maskerOpts.keyNameOnly = true;
  if (opts.mode === 'substitute') maskerOpts.faker = await loadFaker();

  const masker = createMasker(maskerOpts);
  // One session per run: the same value gets the same token/label everywhere
  // in the file, and the token map covers every row.
  const session: MaskSession = masker.createSession();
  const detections: string[] = [];

  const input: Readable = opts.file ? createReadStream(resolve(opts.file)) : io.stdin;

  // ── Output target ─────────────────────────────────────────────────────────
  let outPath: string | undefined;
  let tmpPath: string | undefined;
  let fileStream: Writable | undefined;
  let sink: Sink;
  if (opts.report) {
    sink = { write: async () => {} };
  } else if (!opts.file) {
    sink = streamSink(io.stdout);
  } else {
    const inputPath = resolve(opts.file);
    if (opts.inPlace) {
      outPath = inputPath;
      // Write next to the input, then rename: a crash never leaves a half file
      tmpPath = join(dirname(inputPath), `.${basename(inputPath)}.pii-mask-${process.pid}.tmp`);
    } else {
      const outDir = resolve(opts.output ?? 'masked-output');
      mkdirSync(outDir, { recursive: true });
      outPath = join(outDir, basename(inputPath));
    }
    fileStream = createWriteStream(tmpPath ?? outPath, { encoding: 'utf-8' });
    sink = streamSink(fileStream);
  }

  const maskText = (text: string, key?: string) => {
    const r = masker.maskString(text, key, session);
    detections.push(...r.detections);
    return r.result;
  };
  const maskStructured = (value: unknown) => {
    const r = masker.mask(value, session);
    detections.push(...r.detections);
    return r.result;
  };

  // Quoted cells may span lines and CRLF must be kept, so CSV is read raw.
  const writeCSV = async (raw: string) => {
    const { headers, rows, eol, trailingNewline } = parseCSV(raw);
    const maskedRows = rows.map((row) =>
      row.map((cell, i) => {
        const masked = maskText(cell, headers[i]);
        return masked === cell ? cell : neutralizeFormula(masked);
      }),
    );
    await sink.write(csvToString([headers, ...maskedRows], eol) + (trailingNewline ? eol : ''));
  };

  // JSONL and text are processed a line at a time, so input of any size (or a
  // never-ending pipe from a running app) streams through.
  const writeLineBased = async (lines: AsyncGenerator<string>, known?: Format) => {
    let format = known;
    let first: string | undefined;
    // stdin without --format: sniff the first line. '[' or an unparsable '{'
    // means one JSON document; a parsable '{' line means JSONL; else text.
    if (!format) {
      const next = await lines.next();
      first = next.done ? undefined : next.value;
      const head = first?.trimStart() ?? '';
      if (head.startsWith('[')) format = 'json';
      else if (head.startsWith('{')) {
        try {
          JSON.parse(first!);
          format = 'jsonl';
        } catch {
          format = 'json';
        }
      } else format = 'txt';
    }

    async function* all(): AsyncGenerator<string> {
      if (first !== undefined) yield first;
      yield* lines;
    }

    if (format === 'jsonl') {
      for await (const line of all()) {
        if (!line.trim()) continue;
        let out: string;
        try {
          out = JSON.stringify(maskStructured(JSON.parse(line)));
        } catch {
          // A malformed line is still masked, as text, rather than aborting
          out = maskText(line);
        }
        await sink.write(out + '\n');
      }
    } else if (format === 'txt') {
      for await (const line of all()) await sink.write(maskText(line) + '\n');
    } else {
      // A JSON document has to be parsed whole
      const parts: string[] = [];
      for await (const line of all()) parts.push(line);
      const masked = maskStructured(JSON.parse(parts.join('\n')));
      await sink.write(JSON.stringify(masked, null, 2) + '\n');
    }
  };

  try {
    const format = opts.format ?? (opts.file ? formatFromExtension(opts.file) : undefined);

    if (format === 'csv') {
      await writeCSV(await readText(input));
    } else {
      await writeLineBased(readLines(input), format);
    }

    if (fileStream) {
      fileStream.end();
      await once(fileStream, 'finish');
      if (tmpPath && outPath) renameSync(tmpPath, outPath);
    }
  } catch (err) {
    if (fileStream) {
      fileStream.destroy();
      if (tmpPath) rmSync(tmpPath, { force: true });
    }
    throw err;
  }

  if (opts.tokenMapOut) {
    await persistTokenMap(opts.tokenMapOut, masker.getTokenMap(session));
  }

  if (opts.report) {
    const counts = detections.reduce<Record<string, number>>((acc, id) => {
      acc[id] = (acc[id] ?? 0) + 1;
      return acc;
    }, {});
    io.stderr.write('\n── PII Detection Report ──────────────────────\n');
    for (const [id, count] of Object.entries(counts)) {
      io.stderr.write(`  ${id.padEnd(20)} ${count} instance(s)\n`);
    }
    io.stderr.write('─────────────────────────────────────────────\n\n');
    return;
  }

  if (outPath) {
    io.stderr.write(
      opts.inPlace
        ? `✓  Masked in place: ${opts.file}\n`
        : `✓  Masked output written to ${outPath}\n`,
    );
  }
}
