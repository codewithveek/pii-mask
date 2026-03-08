# AGENTS.md

> Instructions for AI coding agents (Codex, Cursor, Jules, Aider, Claude, etc.) working in this repository.
> Read this file fully before making any changes. Rules here take precedence over general coding instincts.

---

## Project Overview

`@pii-mask` is a TypeScript monorepo — a developer-first PII masking toolkit published as four packages:

| Package | Role |
|---|---|
| `@pii-mask/core` | Zero-dependency masking engine. Detector registry, all modes, all detectors. |
| `@pii-mask/cli` | File I/O adapter. Wraps core. Uses `citty` for command parsing. |
| `@pii-mask/react` | React bindings. `<MaskPII>`, `usePIIMask`, `MaskPIITable`. |
| `@pii-mask/nlp` | Optional NLP extension. Wraps `compromise` for freeform name/place detection. |

**Dependency rule:** `cli`, `react`, and `nlp` depend only on `core`. No circular dependencies. No package skips a level.

---

## Repo Layout

```
pii-mask/
├── packages/
│   ├── core/src/
│   │   ├── types.ts          ← PIICategory, MaskMode, PIIDetector, MaskContext
│   │   ├── registry.ts       ← DetectorRegistry singleton
│   │   ├── engine.ts         ← maskValue(), createContext(), token helpers
│   │   ├── masker.ts         ← createMasker() factory (public API entry point)
│   │   ├── detectors/        ← one file per detector, self-registers on import
│   │   └── lexicon/          ← africa.ts, south-asia.ts, east-asia.ts
│   ├── cli/src/
│   │   ├── index.ts          ← citty entry point, shebang
│   │   ├── commands/mask.ts  ← all CLI flags wired here
│   │   ├── adapters/         ← csv.ts, json.ts, jsonl.ts, txt.ts
│   │   └── utils/            ← stdin.ts, token-map.ts
│   ├── react/src/
│   │   ├── guard.ts          ← CVE version check, runs at import time
│   │   ├── index.ts          ← calls guard, then re-exports components/hooks
│   │   ├── MaskPII.tsx
│   │   ├── MaskPIITable.tsx
│   │   └── hooks/usePIIMask.ts
│   └── nlp/src/
│       ├── compromise-adapter.ts
│       └── detectors/        ← person.ts, place.ts
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Environment Setup

```bash
# Install dependencies (always use pnpm — never npm or yarn)
pnpm install

# Build all packages in dependency order
pnpm turbo build

# Run all tests
pnpm turbo test

# Typecheck all packages
pnpm turbo typecheck

# Lint all packages
pnpm turbo lint
```

**Never run `npm install` or `yarn`. This repo uses pnpm workspaces exclusively.**
Running npm or yarn will corrupt the lockfile and break workspace linking.

---

## Before Every Commit

Run all of the following and ensure they pass. Do not open a PR if any of these fail:

```bash
pnpm turbo typecheck   # zero TypeScript errors, strict mode
pnpm turbo lint        # zero ESLint errors (warnings are acceptable)
pnpm turbo test        # all tests pass, coverage thresholds met
pnpm turbo build       # all packages build cleanly to dist/
```

Coverage thresholds (enforced by Vitest — builds fail if not met):
- Lines: 85%
- Functions: 90%
- Branches: 80%

---

## Adding a New Detector

This is the most common task in `@pii-mask/core`. Follow this exact pattern:

1. **Create the file** at `packages/core/src/detectors/<category>/<id>.ts`
2. **Implement the `PIIDetector` interface** — `id`, `label`, `category`, `regions?`, `detect()`, `mask()`
3. **Self-register** at the bottom of the file: `registry.register(myDetector)`
4. **Re-export** from `packages/core/src/detectors/index.ts`
5. **Write tests** at `packages/core/src/detectors/<category>/<id>.test.ts`

```ts
// Minimum viable detector
import type { PIIDetector } from '../../types.js';
import { PIICategory, MaskMode } from '../../types.js';
import { registry } from '../../registry.js';

const myDetector: PIIDetector = {
  id: 'example-xx',           // kebab-case, unique, never reuse an existing id
  label: 'Example ID (XX)',
  category: PIICategory.GOV_ID,
  regions: ['XX'],             // omit for universal detectors

  detect(value, key) {
    return /^\d{10}$/.test(value);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    // ... handle other modes
    return `***-${value.slice(-4)}`;
  },
};

registry.register(myDetector);
```

**Registry behaviour — warn and replace, not throw:**

`registry.register()` does NOT throw on duplicate IDs. If a detector with the same ID is already registered:
- **Without `{ override: true }`** — emits a `console.warn` then replaces. This covers accidental double-registration and surfaces it loudly during development.
- **With `{ override: true }`** — silent replace. Used internally by `createMasker`'s `resolve()` when a consumer passes a custom detector with the same ID as a built-in. This is a legitimate, documented use case.

```ts
// Accidental double-registration — warns you
registry.register(myDetector);
registry.register(myDetector); // ⚠ console.warn, then replaces

// Intentional consumer override — silent
registry.register(myDetector, { override: true }); // ✓ silent
```

Never change this to a hard throw — consumers legitimately override built-in detectors by ID.

**Rules for detectors:**
- `id` must be kebab-case and globally unique across the entire registry
- `detect()` must be pure and side-effect-free
- `mask()` must handle ALL six modes: `mask`, `redact`, `pseudonymize`, `anonymize`, `tokenize`, `substitute`
- Secret-category detectors (`PIICategory.SECRET`) must always return `'[REDACTED]'` regardless of mode
- Phone detection must use `libphonenumber-js` — never write a phone regex
- **Token generation: always import `generateToken` from `../../engine.js`** — never use `Math.random()`. `generateToken()` uses `node:crypto`'s `randomBytes` and is the single authoritative token source across the entire codebase
- Import `getOrCreateToken` and `getOrCreateLabel` from `../../engine.js` for tokenize/pseudonymize modes — never reimplement these locally

---

## TypeScript Rules

- **Strict mode is non-negotiable.** `tsconfig.base.json` has `strict: true`, `exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true`. Do not disable these per-file.
- **Use `as const` for category/mode enumerations** — never TypeScript `enum`. See `types.ts` for the established pattern.
- **ESM imports require `.js` extensions** even when importing `.ts` source files:
  ```ts
  import { registry } from '../../registry.js';  // ✓
  import { registry } from '../../registry';      // ✗ — will break at runtime
  ```
- **No `any`.** Use `unknown` and narrow with type guards. If a third-party library has incomplete types, declare a local `interface` for the subset you use — do not reach for `any` or `eslint-disable`. See the compromise adapter in `@pii-mask/nlp` for the established pattern (`interface CompromiseWorld`).
- **No non-null assertions (`!`)** unless you have added a preceding guard that makes nullability impossible and have left a comment explaining the reasoning.

---

## Code Style

- Formatter: Prettier with project defaults. Run `pnpm lint` to auto-fix.
- No default exports in `core` or `nlp`. Named exports only.
- React components (`react` package) use default exports per React convention.
- Keep detector files small and single-purpose — one detector per file.
- Do not add `console.log` to library packages (`core`, `react`, `nlp`). Use `console.error` in `cli` only for user-facing error output.
- Comments should explain *why*, not *what*. Avoid restating the code in English.

---

## Masking Modes

The six supported modes. Every `mask()` implementation must handle all of them:

| Mode | Behaviour | Reversible |
|---|---|---|
| `mask` | Partial obscure — preserve type shape | No |
| `redact` | Full `[REDACTED]` | No |
| `pseudonymize` / `anonymize` | Consistent label (`EMAIL_1`) per session | No |
| `tokenize` | Random token, stored in `ctx.tokenMap`, restorable | Yes |
| `substitute` | Plausible fake via `@faker-js/faker` in `ctx.faker` | No |

`shuffle` is **not implemented** in v1. Do not add it.

---

## Security-Sensitive Areas

### React CVE guard (`packages/react/src/guard.ts`)

- `BLOCKED_VERSIONS` is a `Set<string>` of React patch versions with known critical CVEs
- If a new React CVE is disclosed, add affected versions to this set and update the peer dep range in `packages/react/package.json`
- The guard throws at import time — this is intentional, do not weaken it
- Do not remove versions from `BLOCKED_VERSIONS` unless the CVE has been officially retracted

### Detectors

- Never log or persist a raw PII value anywhere in the library code
- `ctx.tokenMap` holds `original → token` mappings — treat this as sensitive in-memory data
- `extractTokenMap()` in `engine.ts` inverts the map before returning to the consumer — do not change this direction

---

## Testing

- Test framework: **Vitest** — do not use Jest
- One test file per source file: `foo.ts` → `foo.test.ts` in the same directory
- Every detector requires at minimum four test cases:
  1. Detects a valid value
  2. Does not detect an invalid value (false-positive guard)
  3. Masks correctly in default `mask` mode
  4. Fully redacts in `redact` mode
- Tokenize round-trip test required for any detector that is not `SECRET` category
- Do not use snapshot tests for masking output — assert exact strings

```bash
# Run tests for a single package only
pnpm turbo test --filter=@pii-mask/core

# Run tests for changed packages only (fast CI path)
pnpm turbo test --filter=[HEAD^1]

# Run with coverage report
pnpm --filter @pii-mask/core exec vitest run --coverage
```

---

## Package-Specific Notes

### `@pii-mask/core`

- `registry.ts` exports a singleton — all detectors share one registry instance per process
- Detectors self-register by importing their file. `detectors/index.ts` is the import that triggers all registrations — it must be imported in `core/src/index.ts`
- `createContext()` in `engine.ts` creates a fresh `MaskContext` per masking call — contexts are never shared across calls. `MaskContext` carries a `detections: string[]` array that `maskValue()` pushes to during traversal — do not collect detections outside the context
- `maskObject()` and `maskArray()` both delegate to `walk()` and read `ctx.detections` directly — there is no separate `collectDetections()` helper and no cast needed
- Lexicon sub-paths (`./lexicon/africa`, etc.) are separate tsup entry points — ensure `tsup.config.ts` lists them explicitly

### `@pii-mask/cli`

- The binary entry point is `src/index.ts` — ensure `package.json` has `"bin": { "pii-mask": "./dist/index.js" }`
- All file I/O lives in `adapters/` and `utils/` — the `commands/mask.ts` file should only orchestrate, not read/write files directly
- Exit codes: `0` = success, `1` = user error (bad args, unsupported format), `2` = unexpected runtime error
- Stdin detection: check `process.stdin.isTTY` — if `true` and no file arg provided, exit with code `1` and a helpful message

### `@pii-mask/react`

- `guard.ts` must run before any React code. `index.ts` calls `assertSafeReactVersion()` as its first statement before any exports
- All components must be SSR-safe — no `window`, `document`, or `localStorage` references
- `usePIIMask` must memoize the masker instance on `[mode, detect, disable]` — do not recreate on every render
- The `reveal` prop renders raw children — it is the caller's responsibility to gate this on authorization. The component does not enforce access control
- **`MaskPIITable` does not exist.** The table primitive is `usePIIMaskTable` — a headless hook that returns `{ maskedData }`. It works with any table library (TanStack, MUI DataGrid, plain HTML) because it produces no markup. Do not add a rendered table component.

### `@pii-mask/nlp`

- `buildCompromiseDetectors()` returns a `PIIDetector[]` — these are passed to `createMasker({ extend: ... })` by the consumer
- The NLP detectors register nothing in the global registry — they are consumer-supplied extensions only
- **Custom lexicon injection uses the object-style `nlp.extend({ words: customLexicon })` — not the callback form.** The callback form `nlp.extend((Doc, world) => {...})` requires typing `world` which compromise does not fully type. The object form sidesteps this entirely and requires no `any`.
- If the callback form is ever genuinely required, declare a local `interface CompromiseWorld { addWords(...): void }` interface — never use `any` or `eslint-disable`
- Token generation in NLP detectors must use `generateToken`, `getOrCreateToken`, and `getOrCreateLabel` imported from `@pii-mask/core` — never reimplement them locally with `Math.random()`
- Never import `@pii-mask/nlp` from `@pii-mask/core`, `@pii-mask/cli`, or `@pii-mask/react` — nlp is always a peer, never a dependency

---

## Pull Request Guidelines

- **One concern per PR.** Adding a detector, fixing a bug, and refactoring the registry are three separate PRs.
- PR title format: `<package>: <short description>` — e.g. `core: add nik-id detector for Indonesia`
- Every new detector PR must include the detector file, its test file, and an update to the detector reference table in `docs/`
- Security-related PRs (CVE guard updates, blocked version list changes) must reference the CVE number in both the commit message and PR description
- Do not bump package versions manually — use `pnpm changeset` and follow the changesets flow

---

## What Not To Do

- **Do not use `npm` or `yarn`** — pnpm only
- **Do not write phone number regexes** — use `libphonenumber-js`
- **Do not use `Math.random()` for token generation** — always use `generateToken()` from `engine.ts` which uses `node:crypto` `randomBytes`. `Math.random()` is not cryptographically secure and must never appear in masking or tokenization code
- **Do not reimplement `getOrCreateToken` or `getOrCreateLabel` locally** — import them from `@pii-mask/core`. Duplication caused the `Math.random()` bug in the NLP adapter; there is one source of truth
- **Do not add `shuffle` mode** — deferred to v1.1, not in scope
- **Do not add an Express middleware package** — explicitly out of scope
- **Do not add a rendered `MaskPIITable` component** — the table primitive is `usePIIMaskTable` hook; markup is the consumer's responsibility
- **Do not limit `maskObject`/`maskArray` traversal depth** — `walk()` in `engine.ts` recurses without an arbitrary depth limit and handles circular references via `WeakSet`. Do not add a `maxDepth` option or early-exit condition unless explicitly approved
- **Do not use `any` in TypeScript** — use `unknown` and narrow, or declare a local interface for incomplete third-party types. The only accepted pattern for compromise's world API is a local `interface CompromiseWorld`
- **Do not weaken the React CVE guard** — do not catch the thrown error, do not make it a warning
- **Do not import `@faker-js/faker` in `core/src/engine.ts` unconditionally** — it is lazy-loaded only when `mode === 'substitute'`, via `createContext()`
- **Do not add runtime dependencies to `@pii-mask/core`** beyond `libphonenumber-js` without explicit approval — core's dependency budget is intentionally minimal
- **Do not use TypeScript `enum`** — use `as const` objects with derived union types (see `types.ts`)
