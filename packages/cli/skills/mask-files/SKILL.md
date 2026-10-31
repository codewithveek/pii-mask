---
name: mask-files
description: >
  Use when masking PII in CSV, JSON, JSONL/NDJSON or text files, or in a
  stdin/stdout pipeline (including a running app's log output), from the
  command line with the pii-mask CLI (@pii-mask/cli), or calling the CLI's
  runMask() from a script.
metadata:
  purpose: >
    Shows how to run the pii-mask CLI on files and pipes, choose formats and
    modes, persist token maps safely, and call the same logic from Node.
  type: core
  library: '@pii-mask/cli'
  library_version: '0.3.0'
sources:
  - src/run.ts
  - src/commands/mask.ts
  - src/adapters/csv.ts
  - README.md
  - src/skills.test.ts
---

# Mask files and pipes with the pii-mask CLI

## Setup

```bash
pnpm add -g @pii-mask/cli        # or: pnpm dlx @pii-mask/cli <file> ...
pii-mask customers.csv --mode redact
# ✓  Masked output written to ./masked-output/customers.csv
```

Output goes to `./masked-output/<file name>` (change with `--output <dir>`, or `--in-place`). Messages go to stderr; with stdin input, masked data goes to stdout. Exit code is `1` on any error, with the reason on stderr.

## Core Patterns

### Pick the format

Files use their extension: `.csv`, `.json`, `.jsonl`/`.ndjson`; anything else is text. Force with `--format csv|json|jsonl|txt`. On stdin the first line decides: `[` or an incomplete `{` → one JSON document; a complete JSON object → NDJSON; otherwise text. CSV on stdin needs `--format csv`.

- **CSV:** headers become keys, so a `password` or `ssn` column is masked by name. Quoted multi-line cells, CRLF and BOM are handled. Masked cells starting with `= + - @` get a leading `'` so spreadsheets don't run them as formulas.
- **JSON:** parsed whole, walked like `mask()` in @pii-mask/core.
- **JSONL / text:** streamed line by line; a malformed JSONL line is masked as text.

### Mask a running app's logs

```bash
node server.js | pii-mask --mode redact > app.log
```

NDJSON (pino) and text stream through as they're written.

### Tokenize and keep the map

```bash
pii-mask users.csv --mode tokenize --token-map-out tokens.json
pii-mask orders.jsonl --mode tokenize --token-map-out tokens.json   # merges into the same file
```

Within one run the same value always gets the same token. The map file holds the original PII and is written with mode `0600`. Restore with `createMasker().restore(text, map)` from @pii-mask/core.

### Configure once

```json
{ "mode": "redact", "disable": ["dob"], "regions": ["NG", "GB"], "output": "./sanitized" }
```

```bash
pii-mask users.json --config .pii-mask.json --report   # counts per detector, writes nothing
```

Flags you pass override the config file; omitted flags never do. Other flags: `--only <ids|categories>`, `--disable <ids>`, `--regions <codes>`, `--key-name-only`.

### Call it from Node

```ts
import { runMask } from '@pii-mask/cli';

await runMask(
  { file: 'users.csv', mode: 'redact', output: 'out' },
  { stdin: process.stdin, stdout: process.stdout, stderr: process.stderr },
);
```

Importing `@pii-mask/cli` has no side effects; the executable entry is `@pii-mask/cli/cli`.

## Common Mistakes

**CRITICAL — Committing or sharing `--token-map-out` files.** They contain every original value in plain text. Keep them out of version control and store them like secrets. Source: `src/utils/token-map.ts`.

**HIGH — `--mode substitute` without faker.** It fails with `mode "substitute" needs @faker-js/faker`; install `@faker-js/faker` (>= 10.5.0) next to the CLI. Source: `src/run.ts`.

**HIGH — Piping CSV through stdin without `--format csv`.** Stdin sniffing never picks CSV, so it's masked as text and header-based detection is lost. Source: `src/run.ts`.

**MEDIUM — Expecting `--in-place` to keep a backup.** It replaces the file after masking succeeds (written atomically via a temp file) and keeps no copy. Source: `src/run.ts`.

## Completion

The output file exists, parses in its format (`JSON.parse`, or the same column count per CSV row), and `grep` for a known original value finds nothing; `--report` lists the detectors you expected. If a value isn't masked, check its column/key name and see @pii-mask/core's custom-detectors skill.
