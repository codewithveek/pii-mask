// Library entry: importing this module has no side effects.
// The executable lives in ./cli.ts.
export { maskCommand, loadConfig, resolveOptions } from './commands/mask.js';
export { runMask, formatFromExtension } from './run.js';
export type { RunOptions, RunIO, Format } from './run.js';
export { parseCSV, csvToString, neutralizeFormula } from './adapters/csv.js';
export { parseJSONL, jsonlToString } from './adapters/jsonl.js';
