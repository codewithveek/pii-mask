# pii-mask-cli

## 0.1.4

### Patch Changes

- 6278bdf: - Ship TanStack Intent skills for AI coding agents: `mask-pii`, `mask-logs` and `custom-detectors` (core), `mask-files` (cli), `mask-pii-react` (react) and `detect-names-in-text` (nlp). Run `npx @tanstack/intent@latest install` to enable them.
  - Publish with npm provenance.
  - nlp: adjacent custom-lexicon words ("Emeka Okafor") are now masked as one entity instead of two.
- Updated dependencies [6278bdf]
  - @pii-mask/cli@0.3.1

## 0.1.3

### Patch Changes

- 5f71c18: - One masking session per run: the same value gets the same token/label in every row and line; `--token-map-out` works for CSV, JSONL and TXT
  - RFC 4180 CSV parsing (quoted multi-line cells, CRLF, BOM), preserving line endings; masked cells that would run as spreadsheet formulas are neutralized
  - JSONL and text stream line by line, from files and stdin; stdin format is auto-detected instead of assumed to be JSON; malformed JSONL lines are masked as text
  - Config-file values are no longer overridden by flag defaults; modes and formats are validated; new `--regions` and `--key-name-only` flags
  - Token map written with mode 0600; `--in-place` writes atomically
  - Substitute mode loads `@faker-js/faker` on demand (optional peer)
  - Importing `@pii-mask/cli` no longer runs the CLI; the executable is `@pii-mask/cli/cli`
- Updated dependencies [5f71c18]
  - @pii-mask/cli@0.3.0

## 0.1.2

### Patch Changes

- @pii-mask/cli@0.2.1

## 0.1.1

### Patch Changes

- Updated dependencies
  - @pii-mask/cli@0.2.0
