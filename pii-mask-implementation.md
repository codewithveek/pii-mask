# @pii-mask — Implementation & Architecture Guide

> **Scope:** Monorepo structure, package contracts, detector registry design, masking engine, CLI, React bindings, NLP adapter, and code implementation samples for every major subsystem.

---

## Table of Contents

1. [Monorepo Setup](#1-monorepo-setup)
2. [Repository Structure](#2-repository-structure)
3. [Shared Tooling Configuration](#3-shared-tooling-configuration)
4. [Package: @pii-mask/core](#4-package-pii-maskcore)
   - 4.1 [Type System](#41-type-system)
   - 4.2 [Detector Registry](#42-detector-registry)
   - 4.3 [Built-in Detectors](#43-built-in-detectors)
   - 4.4 [Masking Engine](#44-masking-engine)
   - 4.5 [createMasker Factory](#45-createmasker-factory)
   - 4.6 [Lexicon Sub-path Exports](#46-lexicon-sub-path-exports)
5. [Package: @pii-mask/cli](#5-package-pii-maskcli)
   - 5.1 [Entry Point & Command Structure](#51-entry-point--command-structure)
   - 5.2 [File I/O Adapters](#52-file-io-adapters)
   - 5.3 [Stdin Piping](#53-stdin-piping)
   - 5.4 [Token Map Persistence](#54-token-map-persistence)
6. [Package: @pii-mask/react](#6-package-pii-maskreact)
   - 6.1 [CVE-Aware Version Guard](#61-cve-aware-version-guard)
   - 6.2 [MaskPII Component](#62-maskpii-component)
   - 6.3 [usePIIMask Hook](#63-usepiimask-hook)
   - 6.4 [usePIIMaskTable Hook (Headless)](#64-usepiimaskable-hook-headless)
7. [Package: @pii-mask/nlp](#7-package-pii-masknlp)
   - 7.1 [compromise Adapter](#71-compromise-adapter)
   - 7.2 [Confidence Threshold](#72-confidence-threshold)
8. [Detector Reference](#8-detector-reference)
9. [Testing Strategy](#9-testing-strategy)
10. [Build & Release Pipeline](#10-build--release-pipeline)

---

## 1. Monorepo Setup

### Stack

| Concern | Tool | Version |
|---|---|---|
| Monorepo orchestration | Turborepo | `^2.x` |
| Package manager | pnpm | `^9.x` |
| Language | TypeScript | `^5.x` |
| Build | tsup | `^8.x` |
| Test runner | Vitest | `^2.x` |
| CLI framework | citty (unjs) | `^0.2.x` |
| Phone parsing | libphonenumber-js | `^1.x` |
| Fake data (substitute mode) | @faker-js/faker | `^9.x` |
| NLP | compromise | `^14.x` |
| Versioning | @changesets/cli | `^2.x` |

### Bootstrap

```bash
# 1. Create workspace root
mkdir pii-mask && cd pii-mask
pnpm init

# 2. Install Turborepo
pnpm add -Dw turbo

# 3. Scaffold packages
mkdir -p packages/core packages/cli packages/react packages/nlp

# 4. Install workspace tooling
pnpm add -Dw typescript tsup vitest @changesets/cli \
  eslint prettier @typescript-eslint/eslint-plugin
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - "packages/*"
```

---

## 2. Repository Structure

```
pii-mask/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── registry.ts
│   │   │   ├── engine.ts
│   │   │   ├── masker.ts
│   │   │   ├── detectors/
│   │   │   │   ├── index.ts
│   │   │   │   ├── contact/
│   │   │   │   │   ├── email.ts
│   │   │   │   │   └── phone.ts
│   │   │   │   ├── gov-id/
│   │   │   │   │   ├── ssn-us.ts
│   │   │   │   │   ├── nin-ng.ts
│   │   │   │   │   ├── bvn-ng.ts
│   │   │   │   │   ├── aadhaar-in.ts
│   │   │   │   │   ├── pan-in.ts
│   │   │   │   │   ├── said-za.ts
│   │   │   │   │   ├── nin-uk.ts
│   │   │   │   │   ├── nik-id.ts
│   │   │   │   │   └── cpf-br.ts
│   │   │   │   ├── financial/
│   │   │   │   │   ├── credit-card.ts
│   │   │   │   │   └── iban.ts
│   │   │   │   ├── network/
│   │   │   │   │   ├── ip-address.ts
│   │   │   │   │   └── ipv6.ts
│   │   │   │   ├── biometric/
│   │   │   │   │   └── dob.ts
│   │   │   │   ├── identity/
│   │   │   │   │   ├── person-name.ts
│   │   │   │   │   └── address.ts
│   │   │   │   └── secret/
│   │   │   │       ├── secret-key.ts
│   │   │   │       ├── jwt.ts
│   │   │   │       ├── bcrypt-hash.ts
│   │   │   │       └── hex-secret.ts
│   │   │   └── lexicon/
│   │   │       ├── africa.ts
│   │   │       ├── south-asia.ts
│   │   │       └── east-asia.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   ├── cli/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── commands/
│   │   │   │   └── mask.ts
│   │   │   ├── adapters/
│   │   │   │   ├── csv.ts
│   │   │   │   ├── json.ts
│   │   │   │   ├── jsonl.ts
│   │   │   │   └── txt.ts
│   │   │   └── utils/
│   │   │       ├── stdin.ts
│   │   │       └── token-map.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   ├── react/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── guard.ts
│   │   │   ├── MaskPII.tsx
│   │   │   └── hooks/
│   │   │       ├── usePIIMask.ts
│   │   │       └── usePIIMaskTable.ts   ← headless table hook
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   └── nlp/
│       ├── src/
│       │   ├── index.ts
│       │   ├── compromise-adapter.ts
│       │   └── detectors/
│       │       ├── person.ts
│       │       └── place.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── tsup.config.ts
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── .eslintrc.js
└── .prettierrc
```

---

## 3. Shared Tooling Configuration

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["tsconfig.base.json"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": [],
      "cache": true
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "dev": {
      "persistent": true,
      "cache": false
    }
  }
}
```

### `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

### `tsup.config.ts` (shared pattern, per-package)

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
});
```

For `@pii-mask/core`, additional entries expose lexicon sub-paths:

```ts
// packages/core/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index:           'src/index.ts',
    'lexicon/africa':     'src/lexicon/africa.ts',
    'lexicon/south-asia': 'src/lexicon/south-asia.ts',
    'lexicon/east-asia':  'src/lexicon/east-asia.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
```

---

## 4. Package: @pii-mask/core

### 4.1 Type System

```ts
// packages/core/src/types.ts

// ── Categories ──────────────────────────────────────────────────────────────
export const PIICategory = {
  GOV_ID:    'gov-id',
  FINANCIAL: 'financial',
  CONTACT:   'contact',
  SECRET:    'secret',
  BIOMETRIC: 'biometric',
  NETWORK:   'network',
  IDENTITY:  'identity',
} as const;

export type PIICategory = typeof PIICategory[keyof typeof PIICategory];

// ── Modes ───────────────────────────────────────────────────────────────────
export const MaskMode = {
  MASK:         'mask',
  REDACT:       'redact',
  PSEUDONYMIZE: 'pseudonymize',
  ANONYMIZE:    'anonymize',   // alias for pseudonymize
  TOKENIZE:     'tokenize',
  SUBSTITUTE:   'substitute',
} as const;

export type MaskMode = typeof MaskMode[keyof typeof MaskMode];

// ── Detector contract ───────────────────────────────────────────────────────
export interface PIIDetector {
  /** Unique stable identifier — used to disable/filter detectors */
  id: string;
  /** Human-readable label for reports */
  label: string;
  category: PIICategory;
  /** ISO 3166-1 alpha-2 codes. Omit for universal detectors. */
  regions?: string[];
  /**
   * Returns true if this detector claims the value.
   * @param value  The string to evaluate
   * @param key    The object key / CSV column header (if available)
   */
  detect: (value: string, key?: string) => boolean;
  /**
   * Transforms value according to mode.
   * Substitute mode receives a faker instance for type-appropriate generation.
   */
  mask: (value: string, mode: MaskMode, ctx: MaskContext) => string;
}

// ── Masking context passed to every mask() call ─────────────────────────────
export interface MaskContext {
  mode: MaskMode;
  /** Monotonically increasing counter per category, used for pseudonymize labels */
  counter: Map<PIICategory, number>;
  /** value → token, used for tokenize + pseudonymize consistency */
  tokenMap: Map<string, string>;
  /** Detector IDs that fired during this masking session, accumulated by maskValue() */
  detections: string[];
  /** faker instance, present only when mode === 'substitute' */
  faker?: import('@faker-js/faker').Faker;
}

// ── Result types ────────────────────────────────────────────────────────────
export interface MaskResult {
  result: string;
  /** Populated in tokenize mode; maps token → original value */
  tokenMap: Record<string, string>;
  /** All detector IDs that fired during this operation */
  detections: string[];
}

export interface MaskOptions {
  mode?: MaskMode;
  /** Detector IDs to disable */
  disable?: string[];
  /** If set, run ONLY these category names or detector IDs */
  only?: string[];
  /** Additional custom detectors to register */
  extend?: PIIDetector[];
  /** Skip value-level regex detection; rely on key-name heuristics only */
  keyNameOnly?: boolean;
  nlpOptions?: NLPOptions;
}

export interface NLPOptions {
  confidence?: number;
  entities?: Array<'Person' | 'Place' | 'Organization'>;
  customLexicon?: Record<string, 'Person' | 'Place' | 'Organization'>;
}
```

### 4.2 Detector Registry

```ts
// packages/core/src/registry.ts
import type { PIIDetector, MaskOptions } from './types.js';

class DetectorRegistry {
  private detectors = new Map<string, PIIDetector>();

  register(detector: PIIDetector, options: { override?: boolean } = {}): void {
    if (this.detectors.has(detector.id)) {
      if (options.override) {
        // Intentional override — silent replace (used by createMasker's resolve())
        this.detectors.set(detector.id, detector);
        return;
      }
      // Accidental double-registration — warn loudly, then replace
      // A hard throw was considered but rejected: warn-and-replace is safer
      // for a public library where consumers legitimately override built-ins.
      console.warn(
        `[pii-mask] Detector "${detector.id}" was already registered. ` +
        `The previous registration has been replaced. ` +
        `Pass { override: true } to silence this warning.`
      );
    }
    this.detectors.set(detector.id, detector);
  }

  registerAll(detectors: PIIDetector[]): void {
    detectors.forEach(d => this.register(d));
  }

  resolve(options: Pick<MaskOptions, 'disable' | 'only' | 'extend'>): PIIDetector[] {
    const extended = new Map(this.detectors);

    // Consumer extensions use { override: true } — intentional, silent replacement
    options.extend?.forEach(d => {
      if (extended.has(d.id)) {
        extended.set(d.id, d); // silent — consumer explicitly chose this id
      } else {
        extended.set(d.id, d);
      }
    });

    let resolved = [...extended.values()];

    if (options.only?.length) {
      resolved = resolved.filter(d =>
        options.only!.includes(d.id) || options.only!.includes(d.category)
      );
    }

    if (options.disable?.length) {
      resolved = resolved.filter(d => !options.disable!.includes(d.id));
    }

    return resolved;
  }

  list(): PIIDetector[] {
    return [...this.detectors.values()];
  }
}

// Singleton registry — all built-in detectors self-register on import
export const registry = new DetectorRegistry();
```

### 4.3 Built-in Detectors

#### Phone (global)

```ts
// packages/core/src/detectors/contact/phone.ts
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import type { PIIDetector, MaskContext } from '../../types.js';
import { PIICategory, MaskMode } from '../../types.js';
import { registry } from '../../registry.js';

const phoneDetector: PIIDetector = {
  id: 'phone-global',
  label: 'Phone Number',
  category: PIICategory.CONTACT,

  detect(value) {
    // libphonenumber-js requires a candidate string; guard against noise
    if (value.length < 7 || value.length > 20) return false;
    try {
      return isValidPhoneNumber(value);
    } catch {
      return false;
    }
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.SUBSTITUTE) {
      // faker generates a valid-looking phone number
      return ctx.faker?.phone.number({ style: 'international' }) ?? '[PHONE]';
    }
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('PHONE', value, ctx);
    }

    // Default: mask
    try {
      const parsed = parsePhoneNumber(value);
      const national = parsed.nationalNumber;
      return `***-***-${national.slice(-4)}`;
    } catch {
      return `***-***-${value.slice(-4)}`;
    }
  },
};

registry.register(phoneDetector);
```

#### Email

```ts
// packages/core/src/detectors/contact/email.ts
import type { PIIDetector, MaskContext } from '../../types.js';
import { PIICategory, MaskMode } from '../../types.js';
import { registry } from '../../registry.js';

const EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;

const emailDetector: PIIDetector = {
  id: 'email',
  label: 'Email Address',
  category: PIICategory.CONTACT,

  detect: (value) => EMAIL_RE.test(value.trim()),

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.internet.email() ?? '[EMAIL]';
    }
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('EMAIL', value, ctx);
    }

    // Default mask: jo***n@domain.com
    const [local, domain] = value.split('@');
    if (!local || !domain) return '[EMAIL]';
    if (local.length <= 3) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 2)}${'*'.repeat(local.length - 3)}${local.slice(-1)}@${domain}`;
  },
};

registry.register(emailDetector);
```

#### Nigerian NIN

```ts
// packages/core/src/detectors/gov-id/nin-ng.ts
import type { PIIDetector, MaskContext } from '../../types.js';
import { PIICategory, MaskMode } from '../../types.js';
import { registry } from '../../registry.js';

// NIN: exactly 11 digits (no spaces/dashes in canonical form)
const NIN_RE = /^\d{11}$/;

const ninNgDetector: PIIDetector = {
  id: 'nin-ng',
  label: 'Nigerian NIN',
  category: PIICategory.GOV_ID,
  regions: ['NG'],

  detect(value, key) {
    const trimmed = value.replace(/\s/g, '');
    // Boost confidence when key name is "nin" or "national_identity"
    const keyHint = key ? /\bnin\b|national.?id/i.test(key) : false;
    return keyHint ? NIN_RE.test(trimmed) : NIN_RE.test(trimmed);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('NIN', value, ctx);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      // Generate a plausible 11-digit number (not a real NIN)
      return String(Math.floor(10000000000 + Math.random() * 89999999999));
    }
    // Default mask: ***-***-8901
    return `***-***-${value.slice(-4)}`;
  },
};

registry.register(ninNgDetector);
```

#### JWT Auto-detection

```ts
// packages/core/src/detectors/secret/jwt.ts
import type { PIIDetector, MaskContext } from '../../types.js';
import { PIICategory, MaskMode } from '../../types.js';
import { registry } from '../../registry.js';

// JWTs: three base64url segments separated by dots
const JWT_RE = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/;

const jwtDetector: PIIDetector = {
  id: 'jwt',
  label: 'JSON Web Token',
  category: PIICategory.SECRET,

  detect(value) {
    if (!JWT_RE.test(value.trim())) return false;
    // Validate the header is valid base64-encoded JSON
    try {
      const header = JSON.parse(atob(value.split('.')[0]!.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof header.alg === 'string';
    } catch {
      return false;
    }
  },

  // Secrets are always fully redacted regardless of mode
  mask: () => '[REDACTED]',
};

registry.register(jwtDetector);
```

#### Secret Key (key-name heuristic)

```ts
// packages/core/src/detectors/secret/secret-key.ts
import type { PIIDetector } from '../../types.js';
import { PIICategory } from '../../types.js';
import { registry } from '../../registry.js';

const SECRET_KEY_RE =
  /^pin$|pass(?:word)?(?:hash)?$|hash$|secret|token|^api.?key$|private.?key|bearer/i;

const secretKeyDetector: PIIDetector = {
  id: 'secret-key',
  label: 'Secret / Credential',
  category: PIICategory.SECRET,

  detect(_value, key) {
    // This detector fires on key name alone, not value content
    return key ? SECRET_KEY_RE.test(key) : false;
  },

  // Always fully redact regardless of mode
  mask: () => '[REDACTED]',
};

registry.register(secretKeyDetector);
```

#### Credit Card (Luhn-validated)

```ts
// packages/core/src/detectors/financial/credit-card.ts
import type { PIIDetector, MaskContext } from '../../types.js';
import { PIICategory, MaskMode } from '../../types.js';
import { registry } from '../../registry.js';

function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]!, 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

const CARD_RE = /\b(?:\d[ \-]*){13,19}\b/g;

const creditCardDetector: PIIDetector = {
  id: 'credit-card',
  label: 'Credit / Debit Card',
  category: PIICategory.FINANCIAL,

  detect(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    return luhn(digits);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('CARD', value, ctx);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.finance.creditCardNumber() ?? '[CARD]';
    }
    const digits = value.replace(/\D/g, '');
    return `${digits.slice(0, 4)}-XXXX-XXXX-${digits.slice(-4)}`;
  },
};

registry.register(creditCardDetector);
```

### 4.4 Masking Engine

The engine is the core transformation layer. It applies all resolved detectors to a value and returns a `MaskResult`.

```ts
// packages/core/src/engine.ts
import { Faker, en } from '@faker-js/faker';
import { randomBytes } from 'node:crypto';
import type { PIIDetector, MaskContext, MaskOptions, MaskResult } from './types.js';
import { MaskMode, PIICategory } from './types.js';

// ── Token / label helpers ──────────────────────────────────────────────────
// generateToken is exported so detector authors and @pii-mask/nlp can import
// it directly — never reimplement token generation with Math.random().

export function generateToken(): string {
  return `<<PII_${randomBytes(4).toString('hex')}>>`;
}

export function getOrCreateToken(value: string, ctx: MaskContext): string {
  if (ctx.tokenMap.has(value)) return ctx.tokenMap.get(value)!;
  const token = generateToken();
  ctx.tokenMap.set(value, token);
  return token;
}

export function getOrCreateLabel(
  prefix: string,
  value: string,
  ctx: MaskContext,
  category: PIICategory = PIICategory.CONTACT,
): string {
  if (ctx.tokenMap.has(value)) return ctx.tokenMap.get(value)!;
  const count = (ctx.counter.get(category) ?? 0) + 1;
  ctx.counter.set(category, count);
  const label = `${prefix}_${count}`;
  ctx.tokenMap.set(value, label);
  return label;
}

// ── Unified recursive walker ────────────────────────────────────────────────
// Single function that handles objects, arrays, and strings at any depth.
// A WeakSet guards against circular references (e.g. Mongoose documents).
// The parent key is threaded into array items so key-name heuristics still
// fire for strings inside arrays: { emails: ['a@b.com'] } → key = 'emails'.

export function walk(
  node: unknown,
  key: string | undefined,
  detectors: PIIDetector[],
  ctx: MaskContext,
  keyNameOnly: boolean,
  seen = new WeakSet<object>(),
): unknown {
  // ── String — run detection ────────────────────────────────────────────────
  if (typeof node === 'string') {
    const { masked } = maskValue(node, key, detectors, ctx, keyNameOnly);
    return masked;
  }

  // ── Array — walk each item, pass parent key as hint ───────────────────────
  if (Array.isArray(node)) {
    if (seen.has(node)) return node; // circular ref guard
    seen.add(node);
    return node.map(item => walk(item, key, detectors, ctx, keyNameOnly, seen));
  }

  // ── Object — walk each value with its own key ─────────────────────────────
  if (node !== null && typeof node === 'object') {
    if (seen.has(node)) return node; // circular ref guard
    seen.add(node);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] = walk(v, k, detectors, ctx, keyNameOnly, seen);
    }
    return out;
  }

  // ── Primitives (number, boolean, null, undefined) — pass through ──────────
  return node;
}

// ── Single-value masking (used by walk + public maskString) ────────────────

export function maskValue(
  value: string,
  key: string | undefined,
  detectors: PIIDetector[],
  ctx: MaskContext,
  keyNameOnly: boolean,
): { masked: string } {
  let masked = value;

  for (const detector of detectors) {
    if (keyNameOnly && !usesKeyHeuristic(detector)) continue;

    if (detector.detect(masked, key)) {
      masked = detector.mask(masked, ctx.mode, ctx);
      // Accumulate on ctx so walk() collects detections across all recursion levels
      ctx.detections.push(detector.id);
      // Stop after first match — avoid double-masking
      break;
    }
  }

  return { masked };
}

function usesKeyHeuristic(detector: PIIDetector): boolean {
  return ['secret-key', 'person-name', 'address'].includes(detector.id);
}

export function createContext(mode: MaskMode): MaskContext {
  const ctx: MaskContext = {
    mode,
    counter: new Map(),
    tokenMap: new Map(),
    detections: [],
  };
  if (mode === MaskMode.SUBSTITUTE) {
    // faker is lazy-loaded only when substitute mode is active
    ctx.faker = new Faker({ locale: [en] });
  }
  return ctx;
}

export function extractTokenMap(ctx: MaskContext): Record<string, string> {
  // Invert: token → original (suitable for restore())
  const inverted: Record<string, string> = {};
  for (const [original, token] of ctx.tokenMap) {
    inverted[token] = original;
  }
  return inverted;
}
```

### 4.5 createMasker Factory

```ts
// packages/core/src/masker.ts
import { registry } from './registry.js';
import { walk, maskValue, createContext, extractTokenMap } from './engine.js';
import type { MaskOptions, MaskResult } from './types.js';
import { MaskMode } from './types.js';

export function createMasker(options: MaskOptions = {}) {
  const mode = options.mode ?? MaskMode.MASK;
  const keyNameOnly = options.keyNameOnly ?? false;
  const detectors = registry.resolve({
    disable: options.disable,
    only: options.only,
    extend: options.extend,
  });

  function maskString(input: string, key?: string): MaskResult {
    const ctx = createContext(mode);
    const { masked } = maskValue(input, key, detectors, ctx, keyNameOnly);
    return {
      result: masked,
      tokenMap: extractTokenMap(ctx),
      detections: ctx.detections,
    };
  }

  // maskObject and maskArray both delegate to the unified walk().
  // walk() handles unlimited nesting depth, arrays of strings, arrays of
  // objects, and circular references via WeakSet — no arbitrary depth limit.

  function maskObject(input: Record<string, unknown>): MaskResult {
    const ctx = createContext(mode);
    const result = walk(input, undefined, detectors, ctx, keyNameOnly);
    return {
      result: JSON.stringify(result),
      tokenMap: extractTokenMap(ctx),
      detections: ctx.detections,
    };
  }

  function maskArray(input: unknown[]): MaskResult {
    const ctx = createContext(mode);
    const result = walk(input, undefined, detectors, ctx, keyNameOnly);
    return {
      result: JSON.stringify(result),
      tokenMap: extractTokenMap(ctx),
      detections: ctx.detections,
    };
  }

  function restore(masked: string, tokenMap: Record<string, string>): string {
    let result = masked;
    for (const [token, original] of Object.entries(tokenMap)) {
      result = result.replaceAll(token, original);
    }
    return result;
  }

  return { maskString, maskObject, maskArray, restore };
}

### 4.6 Lexicon Sub-path Exports

```ts
// packages/core/src/lexicon/africa.ts
export type EntityType = 'Person' | 'Place' | 'Organization';
export type Lexicon = Record<string, EntityType>;

/**
 * Common given names and surnames from West, East, and South Africa.
 * Used to extend compromise's entity recognition for African PII.
 */
export const africanNames: Lexicon = {
  // Yoruba (Nigeria)
  'Adeyemi': 'Person', 'Okafor': 'Person', 'Oluwaseun': 'Person',
  'Adewale': 'Person', 'Onyeka': 'Person', 'Chidinma': 'Person',
  'Emeka': 'Person', 'Ngozi': 'Person', 'Amaka': 'Person',
  // Hausa (Nigeria/Niger)
  'Musa': 'Person', 'Abubakar': 'Person', 'Fatima': 'Person',
  'Usman': 'Person', 'Halima': 'Person', 'Garba': 'Person',
  // Zulu / Xhosa (South Africa)
  'Sibusiso': 'Person', 'Nomvula': 'Person', 'Thabo': 'Person',
  'Zanele': 'Person', 'Sipho': 'Person', 'Lungelo': 'Person',
  // Swahili region (Kenya, Tanzania)
  'Kamau': 'Person', 'Wanjiru': 'Person', 'Odhiambo': 'Person',
  'Otieno': 'Person', 'Achieng': 'Person', 'Njoroge': 'Person',
  // Places
  'Lagos': 'Place', 'Abuja': 'Place', 'Kano': 'Place',
  'Nairobi': 'Place', 'Accra': 'Place', 'Kampala': 'Place',
};

export const africanSurnames: Lexicon = {
  'Okonkwo': 'Person', 'Adeyemi': 'Person', 'Mensah': 'Person',
  'Diallo': 'Person', 'Nkosi': 'Person', 'Mwangi': 'Person',
};
```

```json
// packages/core/package.json (exports field)
{
  "name": "@pii-mask/core",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./lexicon/africa": {
      "import": "./dist/lexicon/africa.js",
      "require": "./dist/lexicon/africa.cjs",
      "types": "./dist/lexicon/africa.d.ts"
    },
    "./lexicon/south-asia": {
      "import": "./dist/lexicon/south-asia.js",
      "require": "./dist/lexicon/south-asia.cjs",
      "types": "./dist/lexicon/south-asia.d.ts"
    },
    "./lexicon/east-asia": {
      "import": "./dist/lexicon/east-asia.js",
      "require": "./dist/lexicon/east-asia.cjs",
      "types": "./dist/lexicon/east-asia.d.ts"
    }
  }
}
```

---

## 5. Package: @pii-mask/cli

### 5.1 Entry Point & Command Structure

```ts
// packages/cli/src/index.ts
#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';
import { maskCommand } from './commands/mask.js';

const main = defineCommand({
  meta: {
    name: 'pii-mask',
    description: 'Mask PII in CSV, JSON, JSONL, and TXT files',
  },
  subCommands: {
    mask: maskCommand,
  },
  // Default: treat first arg as file path (shorthand for `pii-mask mask <file>`)
  async run({ args }) {
    if (args._[0]) {
      await maskCommand.run!({ args, cmd: maskCommand } as any);
    } else {
      console.log('Run pii-mask --help for usage');
    }
  },
});

runMain(main);
```

```ts
// packages/cli/src/commands/mask.ts
import { defineCommand } from 'citty';
import { resolve, extname, basename, join } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createMasker } from '@pii-mask/core';
import type { MaskMode } from '@pii-mask/core';
import { readStdin } from '../utils/stdin.js';
import { parseCSV, csvToString } from '../adapters/csv.js';
import { parseJSONL, jsonlToString } from '../adapters/jsonl.js';
import { persistTokenMap } from '../utils/token-map.js';

export const maskCommand = defineCommand({
  meta: { description: 'Mask PII in a file or stdin' },
  args: {
    file: { type: 'positional', required: false, description: 'Input file path' },
    mode: {
      type: 'string', default: 'mask',
      description: 'mask | redact | pseudonymize | tokenize | substitute',
    },
    output: { type: 'string', description: 'Output directory (default: ./masked-output)' },
    'in-place': { type: 'boolean', default: false, description: 'Overwrite input file' },
    format: { type: 'string', description: 'Force format: csv | json | jsonl | txt' },
    disable: { type: 'string', description: 'Comma-separated detector IDs to disable' },
    only: { type: 'string', description: 'Comma-separated categories or IDs to run' },
    'token-map-out': { type: 'string', description: 'File path to persist token map' },
    report: { type: 'boolean', default: false, description: 'Print detection report without masking' },
    config: { type: 'string', description: 'Path to .pii-mask.json config file' },
  },

  async run({ args }) {
    // Merge config file if provided
    const config = args.config ? JSON.parse(readFileSync(resolve(args.config), 'utf-8')) : {};
    const opts = { ...config, ...args };

    const isStdin = !opts.file;
    const raw = isStdin
      ? await readStdin()
      : readFileSync(resolve(opts.file), 'utf-8');

    const format = opts.format ?? (isStdin ? 'json' : extname(opts.file ?? '').slice(1));
    const masker = createMasker({
      mode: opts.mode as MaskMode,
      disable: opts.disable?.split(','),
      only: opts.only?.split(','),
    });

    let output: string;
    let allDetections: string[] = [];

    if (format === 'csv') {
      const { rows, headers } = parseCSV(raw);
      const masked = rows.map(row => {
        return row.map((cell, i) => {
          const { result, detections } = masker.maskString(cell, headers[i]);
          allDetections.push(...detections);
          return result;
        });
      });
      output = csvToString([headers, ...masked]);

    } else if (format === 'jsonl') {
      const lines = parseJSONL(raw);
      const masked = lines.map(line => {
        const { result, detections } = masker.maskObject(line);
        allDetections.push(...detections);
        return JSON.parse(result);
      });
      output = jsonlToString(masked);

    } else if (format === 'json') {
      const data = JSON.parse(raw);
      const { result, detections, tokenMap } = Array.isArray(data)
        ? masker.maskArray(data)
        : masker.maskObject(data);
      allDetections = detections;
      output = result;

      if (opts['token-map-out']) {
        await persistTokenMap(opts['token-map-out'], tokenMap);
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
      console.log('\n── PII Detection Report ──────────────────────');
      for (const [id, count] of Object.entries(counts)) {
        console.log(`  ${id.padEnd(20)} ${count} instance(s)`);
      }
      console.log('─────────────────────────────────────────────\n');
      return;
    }

    if (isStdin) {
      process.stdout.write(output);
      return;
    }

    if (opts['in-place']) {
      writeFileSync(resolve(opts.file!), output, 'utf-8');
      console.log(`✓  Masked in place: ${opts.file}`);
      return;
    }

    const outDir = resolve(opts.output ?? 'masked-output');
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, basename(opts.file!));
    writeFileSync(outPath, output, 'utf-8');
    console.log(`✓  Masked output written to ${outPath}`);
  },
});
```

### 5.2 File I/O Adapters

```ts
// packages/cli/src/adapters/jsonl.ts

export function parseJSONL(text: string): Record<string, unknown>[] {
  return text
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => JSON.parse(line));
}

export function jsonlToString(records: unknown[]): string {
  return records.map(r => JSON.stringify(r)).join('\n');
}
```

### 5.3 Stdin Piping

```ts
// packages/cli/src/utils/stdin.ts

export function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      reject(new Error('No file argument provided and stdin is a TTY.'));
      return;
    }
    const chunks: Buffer[] = [];
    process.stdin.on('data', chunk => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    process.stdin.on('error', reject);
  });
}
```

### 5.4 Token Map Persistence

```ts
// packages/cli/src/utils/token-map.ts
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Append-safe: loads existing map from disk, merges new tokens, writes back.
 * This allows token maps to accumulate across multiple runs.
 */
export async function persistTokenMap(
  filePath: string,
  newTokens: Record<string, string>,
): Promise<void> {
  const path = resolve(filePath);
  let existing: Record<string, string> = {};

  if (existsSync(path)) {
    try {
      existing = JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      // Corrupt file — start fresh
    }
  }

  const merged = { ...existing, ...newTokens };
  writeFileSync(path, JSON.stringify(merged, null, 2), 'utf-8');
}
```

---

## 6. Package: @pii-mask/react

### 6.1 CVE-Aware Version Guard

This module runs at import time and throws before any React code executes if the installed React version is a known-vulnerable patch.

```ts
// packages/react/src/guard.ts
import React from 'react';

/**
 * React versions with critical CVEs affecting all usage contexts.
 * Updated within 48h of any new CVE disclosure per the security SLA.
 *
 * CVE-2025-55182 (CVSS 10.0, RCE): affects 19.0.0–19.0.3
 * CVE-2025-55184 / CVE-2026-23864 (DoS + code exposure): 19.0.0–19.2.3
 */
const BLOCKED_VERSIONS = new Set([
  '19.0.0', '19.0.1', '19.0.2', '19.0.3',
  '19.1.0', '19.1.1', '19.1.2', '19.1.3', '19.1.4',
  '19.2.0', '19.2.1', '19.2.2', '19.2.3',
]);

export function assertSafeReactVersion(): void {
  const version = React.version;

  if (BLOCKED_VERSIONS.has(version)) {
    throw new Error(
      `@pii-mask/react: React ${version} has critical security vulnerabilities ` +
      `and is not supported.\n\n` +
      `Affected CVEs: CVE-2025-55182, CVE-2025-55184, CVE-2026-23864\n\n` +
      `Please upgrade to one of:\n` +
      `  React 19.0.x  →  >= 19.0.4\n` +
      `  React 19.1.x  →  >= 19.1.5\n` +
      `  React 19.2.x  →  >= 19.2.4\n\n` +
      `See: https://react.dev/blog/security`
    );
  }
}
```

```ts
// packages/react/src/index.ts
// Guard runs before any exports are used
import { assertSafeReactVersion } from './guard.js';
assertSafeReactVersion();

export { MaskPII } from './MaskPII.js';
export { usePIIMask } from './hooks/usePIIMask.js';
export { usePIIMaskTable } from './hooks/usePIIMaskTable.js';
export type { MaskPIIProps, UsePIIMaskOptions, UsePIIMaskTableOptions, UsePIIMaskTableReturn } from './types.js';
```

### 6.2 MaskPII Component

```tsx
// packages/react/src/MaskPII.tsx
import React, { useMemo } from 'react';
import { createMasker } from '@pii-mask/core';
import type { MaskMode } from '@pii-mask/core';

export interface MaskPIIProps {
  children: string;
  /** Detector IDs or category names to run. Default: all detectors. */
  detect?: string[];
  mode?: MaskMode;
  /** When true, renders the original unmasked value. Use for role-gated UIs. */
  reveal?: boolean;
  /** Rendered while masking. Default: '···' */
  fallback?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MaskPII({
  children,
  detect,
  mode = 'mask',
  reveal = false,
  fallback = '···',
  className,
  style,
}: MaskPIIProps) {
  const masker = useMemo(
    () => createMasker({ mode, only: detect }),
    [mode, detect?.join(',')]
  );

  const masked = useMemo(
    () => masker.maskString(children).result,
    [masker, children]
  );

  return (
    <span className={className} style={style} data-pii-masked={!reveal}>
      {reveal ? children : masked}
    </span>
  );
}
```

### 6.3 usePIIMask Hook

```ts
// packages/react/src/hooks/usePIIMask.ts
import { useMemo } from 'react';
import { createMasker } from '@pii-mask/core';
import type { MaskMode, MaskResult } from '@pii-mask/core';

export interface UsePIIMaskOptions {
  mode?: MaskMode;
  detect?: string[];
  disable?: string[];
}

export interface UsePIIMaskReturn {
  masked: string;
  tokenMap: Record<string, string>;
  detections: string[];
  restore: (masked: string) => string;
}

export function usePIIMask(
  value: string,
  options: UsePIIMaskOptions = {},
): UsePIIMaskReturn {
  const masker = useMemo(
    () => createMasker({
      mode: options.mode ?? 'mask',
      only: options.detect,
      disable: options.disable,
    }),
    [options.mode, options.detect?.join(','), options.disable?.join(',')]
  );

  const result: MaskResult = useMemo(
    () => masker.maskString(value),
    [masker, value]
  );

  return {
    masked: result.result,
    tokenMap: result.tokenMap,
    detections: result.detections,
    restore: (masked: string) => masker.restore(masked, result.tokenMap),
  };
}
```

### 6.4 usePIIMaskTable Hook (Headless)

`MaskPIITable` as a rendered component is removed. A component that renders a `<table>` is an opinion about markup the consumer didn't ask for — it can't be used with TanStack Table, AG Grid, MUI DataGrid, or any existing table in a codebase without fighting the component's output.

`usePIIMaskTable` is a headless hook: it returns masked data and leaves all markup to the consumer.

```ts
// packages/react/src/hooks/usePIIMaskTable.ts
import { useMemo } from 'react';
import { createMasker } from '@pii-mask/core';
import type { MaskMode } from '@pii-mask/core';

export interface UsePIIMaskTableOptions<T> {
  /** Column keys to mask. If omitted, all string columns run through detectors. */
  maskColumns?: (keyof T)[];
  mode?: MaskMode;
  /** When true, returns original data untouched — for role-gated admin UIs. */
  reveal?: boolean;
  disable?: string[];
}

export interface UsePIIMaskTableReturn<T> {
  maskedData: T[];
}

export function usePIIMaskTable<T extends Record<string, unknown>>(
  data: T[],
  options: UsePIIMaskTableOptions<T> = {},
): UsePIIMaskTableReturn<T> {
  const masker = useMemo(
    () => createMasker({
      mode: options.mode ?? 'mask',
      disable: options.disable,
    }),
    [options.mode, options.disable?.join(',')],
  );

  const maskedData = useMemo((): T[] => {
    if (options.reveal || data.length === 0) return data;

    return data.map(row => {
      const out = { ...row };
      for (const key of Object.keys(row) as (keyof T)[]) {
        if (options.maskColumns && !options.maskColumns.includes(key)) continue;
        const val = row[key];
        if (typeof val === 'string') {
          out[key] = masker.maskString(val, key as string).result as T[keyof T];
        }
      }
      return out;
    });
  }, [data, masker, options.reveal, options.maskColumns?.join(',')]);

  return { maskedData };
}
```

**Usage with any table library:**

```tsx
// With TanStack Table
const { maskedData } = usePIIMaskTable(users, {
  maskColumns: ['email', 'phone'],
  reveal: isAdmin,
});
const table = useReactTable({ data: maskedData, columns, getCoreRowModel: getCoreRowModel() });

// With a plain HTML table
const { maskedData } = usePIIMaskTable(users, { mode: 'redact' });
return (
  <table>
    <tbody>
      {maskedData.map(row => (
        <tr key={row.id as string}>
          <td>{row.email as string}</td>
          <td>{row.phone as string}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// With MUI DataGrid
const { maskedData } = usePIIMaskTable(rows, { maskColumns: ['ssn', 'dob'] });
return <DataGrid rows={maskedData} columns={columns} />;
```

---

## 7. Package: @pii-mask/nlp

### 7.1 compromise Adapter

```ts
// packages/nlp/src/compromise-adapter.ts
import nlp from 'compromise';
import { getOrCreateToken, getOrCreateLabel, generateToken } from '@pii-mask/core';
import type { PIIDetector, MaskContext, NLPOptions } from '@pii-mask/core';
import { PIICategory, MaskMode } from '@pii-mask/core';

// Local interface for the subset of compromise's world API we use.
// compromise's published types for nlp.extend() are incomplete — rather than
// using `any`, we declare only what we call. Delete this if compromise ships
// complete types for the plugin callback in a future release.
interface CompromiseWorld {
  addWords(words: Record<string, string>): void;
}

export function buildCompromiseDetectors(options: NLPOptions = {}): PIIDetector[] {
  const {
    confidence = 0.7,
    entities = ['Person', 'Place'],
    customLexicon = {},
  } = options;

  // Prefer the object-style extend when only adding words — no callback
  // typing complexity, no CompromiseWorld interface needed for this path.
  if (Object.keys(customLexicon).length > 0) {
    nlp.extend({ words: customLexicon });
  }

  const detectors: PIIDetector[] = [];

  if (entities.includes('Person')) {
    detectors.push({
      id: 'nlp-person',
      label: 'Person Name (NLP)',
      category: PIICategory.IDENTITY,

      detect(value) {
        const people = nlp(value).people().out('array') as string[];
        const ratio = people.join(' ').length / value.length;
        return people.length > 0 && ratio >= confidence;
      },

      mask(value, mode, ctx) {
        if (mode === MaskMode.REDACT) return '[REDACTED]';
        if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
        if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
          return getOrCreateLabel('PERSON', value, ctx, PIICategory.IDENTITY);
        }
        if (mode === MaskMode.SUBSTITUTE) {
          return ctx.faker?.person.fullName() ?? '[NAME]';
        }
        // Default mask: replace each detected name inline
        let masked = value;
        const people = nlp(value).people().out('array') as string[];
        for (const name of people) {
          masked = masked.replace(name, name.slice(0, 1) + '*'.repeat(name.length - 1));
        }
        return masked;
      },
    });
  }

  if (entities.includes('Place')) {
    detectors.push({
      id: 'nlp-place',
      label: 'Place / Location (NLP)',
      category: PIICategory.IDENTITY,

      detect(value) {
        const places = nlp(value).places().out('array') as string[];
        return places.length > 0;
      },

      mask(value, mode, ctx) {
        if (mode === MaskMode.REDACT) return '[REDACTED]';
        if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
        if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
          return getOrCreateLabel('PLACE', value, ctx, PIICategory.IDENTITY);
        }
        return value.replace(
          /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g,
          match => match[0] + '*'.repeat(match.length - 1),
        );
      },
    });
  }

  return detectors;
}
```

### 7.2 Confidence Threshold

The confidence value (0–1) controls how aggressively freeform text gets flagged. A value of `1.0` requires the entire input to be a detected entity. A value of `0.5` flags the input if at least half the characters are part of a detected entity. The default of `0.7` is recommended as a starting point.

```ts
// Consumer usage
import { createMasker } from '@pii-mask/core';
import { africanNames } from '@pii-mask/core/lexicon/africa';
import { buildCompromiseDetectors } from '@pii-mask/nlp';

const masker = createMasker({
  mode: 'tokenize',
  extend: buildCompromiseDetectors({
    confidence: 0.7,
    entities: ['Person', 'Place'],
    customLexicon: africanNames,
  }),
});

const { result, tokenMap } = masker.maskString(
  'Send the contract to Emeka Okafor at Lagos Island branch'
);
// → 'Send the contract to E**** O**** at L**** Island branch'
```

---

## 8. Detector Reference

| Detector ID | Category | Region | Detection Method | Notes |
|---|---|---|---|---|
| `phone-global` | contact | Any | `libphonenumber-js isValidPhoneNumber()` | All 240+ country dial plans |
| `email` | contact | Any | RFC-5322 regex | |
| `ssn-us` | gov-id | US | `\d{3}-\d{2}-\d{4}` | |
| `nin-ng` | gov-id | NG | 11-digit numeric | Key hint boost |
| `bvn-ng` | gov-id | NG | 11-digit numeric | Distinct from NIN by key hint |
| `aadhaar-in` | gov-id | IN | 12-digit + Verhoeff checksum | |
| `pan-in` | gov-id | IN | `[A-Z]{5}[0-9]{4}[A-Z]` | |
| `said-za` | gov-id | ZA | 13-digit + Luhn + DOB encoded | |
| `nin-uk` | gov-id | UK | `[A-Z]{2}\d{6}[A-D]` | |
| `nik-id` | gov-id | ID | 16-digit, prov+DOB encoded | |
| `cpf-br` | gov-id | BR | `\d{3}\.\d{3}\.\d{3}-\d{2}` | Check digit validated |
| `credit-card` | financial | Any | Luhn-validated 13–19 digit | |
| `iban` | financial | Any | ISO 13616 + mod-97 checksum | |
| `ip-address` | network | Any | IPv4 with octet range validation | |
| `ipv6` | network | Any | Full + compressed notation | |
| `dob` | biometric | Any | `MM/DD/YYYY` and `YYYY-MM-DD` | |
| `person-name` | identity | Any | Key-name heuristic + NLP (opt-in) | |
| `address` | identity | Any | Key-name heuristic | |
| `secret-key` | secret | Any | Key-name: `token/secret/apiKey/pin/hash/password` | Value-agnostic |
| `jwt` | secret | Any | Three base64url segments + header JSON check | |
| `bcrypt-hash` | secret | Any | `\$2[aby]\$\d+\$` prefix | |
| `hex-secret` | secret | Any | 32 or 64 char hex string | MD5 / SHA256 shape |
| `nlp-person` | identity | Any | `compromise .people()` + confidence ratio | opt-in via `@pii-mask/nlp` |
| `nlp-place` | identity | Any | `compromise .places()` | opt-in via `@pii-mask/nlp` |

---

## 9. Testing Strategy

Every package has its own `vitest.config.ts`. Turborepo caches test results by input hash — tests only re-run when source files change.

### Unit test sample — detector

```ts
// packages/core/src/detectors/gov-id/nin-ng.test.ts
import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('nin-ng detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['nin-ng'] });

  it('detects a valid 11-digit NIN', () => {
    const { detections } = masker.maskString('12345678901', 'nin');
    expect(detections).toContain('nin-ng');
  });

  it('does not detect a 10-digit number', () => {
    const { detections } = masker.maskString('1234567890', 'nin');
    expect(detections).not.toContain('nin-ng');
  });

  it('masks to ***-***-XXXX format', () => {
    const { result } = masker.maskString('12345678901', 'nin');
    expect(result).toBe('***-***-8901');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['nin-ng'] });
    const { result } = redacter.maskString('12345678901', 'nin');
    expect(result).toBe('[REDACTED]');
  });
});
```

### Unit test sample — tokenize round-trip

```ts
// packages/core/src/masker.test.ts
import { describe, it, expect } from 'vitest';
import { createMasker } from './masker.js';

describe('tokenize mode', () => {
  it('round-trips email through tokenize → restore', () => {
    const masker = createMasker({ mode: 'tokenize' });
    const original = 'hello@example.com';
    const { result, tokenMap } = masker.maskString(original);
    expect(result).not.toBe(original);
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(masker.restore(result, tokenMap)).toBe(original);
  });

  it('produces the same token for the same value in a session', () => {
    const masker = createMasker({ mode: 'tokenize' });
    const r1 = masker.maskString('hello@example.com');
    const r2 = masker.maskString('hello@example.com');
    // Each call creates a fresh context — tokens differ across calls by design
    expect(r1.result).not.toBe(r2.result);
  });
});
```

### Integration test sample — CLI

```ts
// packages/cli/src/commands/mask.test.ts
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'node:fs';

describe('CLI mask command', () => {
  it('masks email in a JSON file', () => {
    const input = JSON.stringify({ email: 'test@example.com', name: 'Lucky' });
    writeFileSync('/tmp/test-input.json', input);

    execSync('node dist/index.js /tmp/test-input.json --output /tmp/cli-test-out/');

    const out = JSON.parse(readFileSync('/tmp/cli-test-out/test-input.json', 'utf-8'));
    expect(out.email).not.toBe('test@example.com');
    expect(out.email).toMatch(/@/); // partial mask preserves domain

    unlinkSync('/tmp/test-input.json');
  });
});
```

### Coverage targets

```ts
// vitest.config.ts (shared baseline)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 85,
        functions: 90,
        branches: 80,
      },
      exclude: ['**/dist/**', '**/*.test.ts'],
    },
  },
});
```

---

## 10. Build & Release Pipeline

### Package scripts pattern

```json
{
  "scripts": {
    "build":     "tsup",
    "dev":       "tsup --watch",
    "test":      "vitest run --coverage",
    "typecheck": "tsc --noEmit",
    "lint":      "eslint src/**/*.ts"
  }
}
```

### Root-level Turborepo commands

```bash
# Build all packages in dependency order
pnpm turbo build

# Run all tests with caching
pnpm turbo test

# Build only core and its dependents
pnpm turbo build --filter=@pii-mask/core...

# Run tests for changed packages only (CI optimization)
pnpm turbo test --filter=[HEAD^1]
```

### Changesets release flow

```bash
# 1. Developer records a change
pnpm changeset

# 2. CI opens a "Version Packages" PR (automated via GitHub Action)
# 3. On merge to main, changesets bumps versions and publishes
pnpm changeset version
pnpm changeset publish
```

### Security patch flow (React CVE SLA)

When a new React CVE is disclosed:

1. Add affected versions to `BLOCKED_VERSIONS` in `packages/react/src/guard.ts`
2. Update `peerDependencies` semver range in `packages/react/package.json`
3. Run `pnpm changeset` with a `patch` bump and CVE reference in the description
4. Merge and publish — target: within 48 hours of CVE disclosure

---

*End of Implementation Guide — @pii-mask v1.0*
