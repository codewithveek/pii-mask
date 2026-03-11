# @pii-mask/cli

Command-line tool for masking PII in CSV, JSON, JSONL, and plain text files. Wraps `@pii-mask/core` with file I/O, stdin/stdout piping, and detection reports.

## Installation

```bash
# Global install
pnpm add -g @pii-mask/cli

# Or run directly with npx/pnpm dlx
pnpm dlx @pii-mask/cli mask data.json --mode redact
```

## Usage

```
pii-mask mask [file] [options]
```

If no file is provided, reads from **stdin**.

### Basic Examples

```bash
# Mask a JSON file (default 'mask' mode)
pii-mask mask users.json

# Redact all PII in a CSV
pii-mask mask customers.csv --mode redact

# Tokenize and save the token map for later restoration
pii-mask mask records.json --mode tokenize --token-map-out tokens.json

# Pseudonymize JSONL data
pii-mask mask events.jsonl --mode pseudonymize

# Generate fake replacement data
pii-mask mask users.json --mode substitute
```

### Stdin / Stdout

Pipe data through the CLI for use in shell pipelines:

```bash
# Pipe JSON through stdin
cat users.json | pii-mask mask --format json --mode redact

# Pipe from another command
curl -s https://api.example.com/users | pii-mask mask --format json --mode redact > masked.json

# Inline JSON
echo '{"email":"test@example.com","ssn":"123-45-6789"}' | pii-mask mask --format json --mode redact
# → {"email":"[REDACTED]","ssn":"[REDACTED]"}
```

When reading from stdin, use `--format` to specify the format (defaults to `json`).

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `file` | positional | — | Input file path. Omit to read from stdin. |
| `--mode` | string | `mask` | Masking mode: `mask`, `redact`, `pseudonymize`, `anonymize`, `tokenize`, `substitute` |
| `--output` | string | `./masked-output` | Output directory for masked files |
| `--in-place` | boolean | `false` | Overwrite the input file instead of writing to output directory |
| `--format` | string | *(auto)* | Force input format: `csv`, `json`, `jsonl`, `txt`. Auto-detected from file extension when using a file. |
| `--disable` | string | — | Comma-separated detector IDs to skip (e.g. `--disable phone,dob`) |
| `--only` | string | — | Comma-separated detector IDs or categories to run exclusively (e.g. `--only email,ssn-us`) |
| `--token-map-out` | string | — | File path to persist the token map (tokenize mode) |
| `--report` | boolean | `false` | Print a detection report to stderr without masking output |
| `--config` | string | — | Path to a `.pii-mask.json` config file |

### Detection Report

Use `--report` to scan for PII without masking. The report prints to stderr:

```bash
pii-mask mask users.json --report
```

```
── PII Detection Report ──────────────────────
  email                4 instance(s)
  ssn-us               2 instance(s)
  phone                3 instance(s)
─────────────────────────────────────────────
```

### Config File

Create a `.pii-mask.json` config file to set defaults:

```json
{
  "mode": "redact",
  "disable": ["dob", "address"],
  "output": "./sanitized"
}
```

```bash
pii-mask mask users.json --config .pii-mask.json
```

CLI flags override config file values.

## Supported Formats

### JSON

Objects and arrays are walked recursively. All string values are checked against detectors.

```bash
pii-mask mask data.json --mode redact
```

### CSV

The first row is treated as headers. Headers are passed as the `key` parameter to detectors, enabling key-name heuristics (e.g., a column named "password" triggers the secret-key detector).

```bash
pii-mask mask customers.csv --mode mask
```

### JSONL

Each line is parsed as a separate JSON object.

```bash
pii-mask mask events.jsonl --mode pseudonymize
```

### Plain Text

The entire file content is treated as a single string and processed through freeform text scanning.

```bash
pii-mask mask notes.txt --mode redact
```

## Token Map Persistence

In `tokenize` mode, the CLI can persist the token map to a file. The map accumulates across multiple runs — existing tokens are preserved and new ones are appended.

```bash
# First run
pii-mask mask batch1.json --mode tokenize --token-map-out tokens.json

# Second run — merges into existing tokens.json
pii-mask mask batch2.json --mode tokenize --token-map-out tokens.json
```

The token map file is a JSON object mapping tokens to original values:

```json
{
  "<<PII_a1b2c3d4>>": "john@example.com",
  "<<PII_e5f6a7b8>>": "123-45-6789"
}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | User error (bad arguments, unsupported format, TTY with no file) |
| `2` | Unexpected runtime error |

## License

MIT
