import { createInterface } from 'node:readline';
import type { Readable } from 'node:stream';

/** Yields the lines of a stream without buffering the whole input. */
export async function* readLines(input: Readable): AsyncGenerator<string> {
  const rl = createInterface({ input, crlfDelay: Infinity });
  for await (const line of rl) yield line;
}
