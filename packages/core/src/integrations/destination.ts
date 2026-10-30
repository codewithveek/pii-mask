import type { Masker } from '../masker';
import type { MaskOptions } from '../types';
import { toMasker } from './pino';

export interface WritableLike {
  write(chunk: string): unknown;
}

/**
 * Wraps a destination stream so every newline-delimited log line is masked
 * just before it is written. JSON lines are parsed and masked structurally;
 * anything else is masked as text. Works with any NDJSON logger:
 *
 * ```ts
 * const logger = pino({}, maskedDestination(process.stdout, { mode: 'redact' }));
 * ```
 *
 * This sees exactly what would be written — child bindings and serializer
 * output included — at the cost of one JSON parse/stringify per line.
 */
export function maskedDestination(
  destination: WritableLike,
  options: MaskOptions | Masker = {},
): WritableLike & { flush(): void } {
  const masker = toMasker(options);
  let pending = '';

  const maskLine = (line: string): string => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.stringify(masker.mask(JSON.parse(line) as unknown).result);
      } catch {
        // not JSON after all
      }
    }
    return masker.maskString(line).result;
  };

  return {
    write(chunk: string | Uint8Array) {
      pending += typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk);
      let newline: number;
      let out = '';
      while ((newline = pending.indexOf('\n')) !== -1) {
        out += maskLine(pending.slice(0, newline)) + '\n';
        pending = pending.slice(newline + 1);
      }
      if (out) destination.write(out);
      return true;
    },
    /** Writes a trailing partial line, if any. */
    flush() {
      if (pending) {
        destination.write(maskLine(pending));
        pending = '';
      }
    },
  };
}
