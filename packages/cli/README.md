# @pii-mask/cli

Command-line tool for masking PII in CSV, JSON, JSONL, and plain text files. Wraps `@pii-mask/core` with file I/O, stdin/stdout piping, and detection reports.

## Installation

```bash
# Global install
pnpm add -g @pii-mask/cli

# Or run directly with npx/pnpm dlx
pnpm dlx @pii-mask/cli data.json --mode redact
```

## Usage

```
pii-mask [file] [options]
```

If no file is provided, reads from **stdin**.

### Basic Examples

```bash
# Mask a JSON file (default 'mask' mode)
pii-mask users.json

# Redact all PII in a CSV
pii-mask customers.csv --mode redact

# Tokenize and save the token map for later restoration
pii-mask records.json --mode tokenize --token-map-out tokens.json

# Pseudonymize JSONL data
pii-mask events.jsonl --mode pseudonymize

# Generate fake replacement data (needs @faker-js/faker installed next to the CLI)
pii-mask users.json --mode substitute
```

Within one run, the same value always gets the same token or label — across every row, line and column.

### Stdin / Stdout

Pipe data through the CLI for use in shell pipelines:

```bash
# Mask a running app's logs as they're written (pino/NDJSON or plain text)
node server.js | pii-mask --mode redact

# Pipe from another command
curl -s https://api.example.com/users | pii-mask --mode redact > masked.json

# Inline JSON
echo '{"email":"test@example.com","ssn":"123-45-6789"}' | pii-mask --mode redact
# → {"email":"[REDACTED]","ssn":"[REDACTED]"}
```

The stdin format is detected from the first line: a line starting with `[`, or a `{` that isn't a complete JSON object, means one JSON document; a complete JSON object means NDJSON; anything else is plain text. NDJSON and text are streamed line by line, so output appears as input arrives. Use `--format` to override; CSV on stdin needs `--format csv`.

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `file` | positional | — | Input file path. Omit to read from stdin. |
| `--mode` | string | `mask` | Masking mode: `mask`, `redact`, `pseudonymize`, `anonymize`, `tokenize`, `substitute` |
| `--output` | string | `./masked-output` | Output directory for masked files |
| `--in-place` | boolean | `false` | Overwrite the input file instead of writing to output directory |
| `--format` | string | *(auto)* | Force input format: `csv`, `json`, `jsonl`, `txt`. Files: from the extension (`.ndjson` = `jsonl`, unknown = `txt`). Stdin: sniffed. |
| `--disable` | string | — | Comma-separated detector IDs to skip (e.g. `--disable phone-global,dob`) |
| `--only` | string | — | Comma-separated detector IDs or categories to run exclusively (e.g. `--only email,ssn-us`) |
| `--regions` | string | — | Comma-separated ISO country codes; region-specific detectors outside them are skipped (e.g. `--regions NG,GB`) |
| `--key-name-only` | boolean | `false` | Only mask fields whose key names them as sensitive |
| `--token-map-out` | string | — | File to persist the token map (tokenize/pseudonymize). Written with mode `0600` |
| `--report` | boolean | `false` | Print a detection report to stderr without masking output |
| `--config` | string | — | Path to a `.pii-mask.json` config file |

### Detection Report

Use `--report` to scan for PII without masking. The report prints to stderr:

```bash
pii-mask users.json --report
```

```
── PII Detection Report ──────────────────────
  email                4 instance(s)
  ssn-us               2 instance(s)
  phone-global         3 instance(s)
─────────────────────────────────────────────
```

### Config File

Create a `.pii-mask.json` config file to set defaults:

```json
{
  "mode": "redact",
  "disable": ["dob", "address"],
  "regions": ["NG", "GB"],
  "output": "./sanitized"
}
```

```bash
pii-mask users.json --config .pii-mask.json
```

Flags you pass on the command line override config file values; flags you don't pass never do. Allowed keys: `mode`, `disable`, `only`, `regions`, `key-name-only`, `format`, `output`, `in-place`, `token-map-out`, `report` (lists may be arrays or comma-separated strings).

## Supported Formats

### JSON

Objects and arrays are walked recursively. Strings are checked against detectors; numbers are masked when their key is sensitive (`pin`, `ssn`, `phone` …). The document is parsed whole.

```bash
pii-mask data.json --mode redact
```

### CSV

The first row is treated as headers. Headers are passed as the `key` parameter to detectors, enabling key-name heuristics (e.g., a column named "password" triggers the secret-key detector).

Quoted cells may contain commas, quotes and line breaks. CRLF line endings, a UTF-8 BOM and the trailing newline are handled and preserved. A masked cell that starts with `=`, `+`, `-` or `@` (for example a substituted `+1 555…` phone number) is prefixed with `'` so spreadsheet apps don't run it as a formula.

```bash
pii-mask customers.csv --mode mask
```

### JSONL

Each line is parsed as a separate JSON value and streamed through. A line that isn't valid JSON is masked as text instead of aborting the run.

```bash
pii-mask events.jsonl --mode pseudonymize
```

### Plain Text

Each line is streamed through freeform text scanning.

```bash
pii-mask notes.txt --mode redact
```

## Token Map Persistence

In `tokenize` mode, the CLI can persist the token map to a file, for every input format. The map accumulates across multiple runs — existing tokens are preserved and new ones are appended.

The file contains the original PII in plain text, so it is written readable by its owner only (`0600`). Store it like a secret.

```bash
# First run
pii-mask batch1.json --mode tokenize --token-map-out tokens.json

# Second run — merges into existing tokens.json
pii-mask batch2.json --mode tokenize --token-map-out tokens.json
```

The token map file is a JSON object mapping tokens to original values:

```json
{
  "<<PII_3f9c1a0b7d2e4c61>>": "john@example.com",
  "<<PII_a07e55d1c94b2f38>>": "123-45-6789"
}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Any error (bad arguments, unknown mode or format, unreadable or invalid input, TTY with no file); the message is printed to stderr |

With `--in-place`, output goes to a temporary file that replaces the input only after masking succeeds.

## Programmatic use

Importing the package has no side effects (the executable is `@pii-mask/cli/cli`):

```ts
import { runMask } from '@pii-mask/cli';

await runMask(
  { file: 'users.csv', mode: 'redact', output: 'out' },
  { stdin: process.stdin, stdout: process.stdout, stderr: process.stderr },
);
```

## Using with AI coding agents

This package ships [TanStack Intent](https://tanstack.com/intent) skills (`mask-files`) that coding agents load on demand. Run `npx @tanstack/intent@latest install` once in your project to enable them.

## License

MIT
