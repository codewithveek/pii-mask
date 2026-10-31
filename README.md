# @pii-mask

A developer-first PII masking toolkit for TypeScript and JavaScript. Detect, mask, tokenize, and anonymize personally identifiable information across structured data, freeform text, CLI pipelines, and React UIs.

## Packages

| Package                               | Description                                                          | Install                     |
| ------------------------------------- | -------------------------------------------------------------------- | --------------------------- |
| [`@pii-mask/core`](./packages/core)   | Masking engine with 31 built-in detectors, pino/winston integrations | `pnpm add @pii-mask/core`   |
| [`@pii-mask/cli`](./packages/cli)     | File I/O adapter for CSV, JSON, JSONL, and TXT files                 | `pnpm add -g @pii-mask/cli` |
| [`@pii-mask/react`](./packages/react) | React bindings — `<MaskPII>`, `usePIIMask`, `usePIIMaskTable`        | `pnpm add @pii-mask/react`  |
| [`@pii-mask/nlp`](./packages/nlp)     | Optional NLP extension for freeform name/place detection             | `pnpm add @pii-mask/nlp`    |

## Quick Start

```ts
import { createMasker } from '@pii-mask/core';

const masker = createMasker({ mode: 'redact' });

// Structured data — returns a masked copy with the same shape
const { result } = masker.mask({
  name: 'John Doe',
  email: 'john@example.com',
  ssn: '123-45-6789',
  createdAt: '2024-01-15',
});
// → { name: '[REDACTED]', email: '[REDACTED]', ssn: '[REDACTED]', createdAt: '2024-01-15' }
// (maskObject() does the same and returns the result as a JSON string)

// Freeform text
const { result: text } = masker.maskString('Contact me at john@example.com');
// → "Contact me at [REDACTED]"

// Region-scoped detection (only run detectors for specific countries)
const ngMasker = createMasker({ mode: 'mask', regions: ['NG'] });

// Detection-only (no masking)
const { detections } = masker.detectString('john@example.com');
// → ['email']

// Session for cross-call consistency (shared token map and counters)
const session = masker.createSession();
masker.maskString('john@example.com', undefined, session);
masker.maskString('john@example.com', undefined, session); // same token/label
```

### Masking logs

```ts
import pino from 'pino';
import { pinoMask, winstonMask } from '@pii-mask/core';

const logger = pino({ ...pinoMask({ mode: 'redact' }) });
logger.info({ user: { email: 'jane@acme.com' } }, 'login from %s', '10.1.2.3');
// {"level":30,…,"user":{"email":"[REDACTED]"},"msg":"login from [REDACTED]"}

// winston: format.combine(winstonMask({ mode: 'redact' }), format.json())
```

See [`@pii-mask/core`](./packages/core#logging-integrations) for `maskedDestination()` and details.

## Masking Modes

| Mode           | Behaviour                                                                   | Reversible |
| -------------- | --------------------------------------------------------------------------- | ---------- |
| `mask`         | Partial obscure — preserves type shape (`jo*****e@example.com`)             | No         |
| `redact`       | Full replacement with `[REDACTED]`                                          | No         |
| `pseudonymize` | Consistent labels per session, numbered per type (`EMAIL_1`, `SSN_1`)       | No         |
| `anonymize`    | Same as pseudonymize — consistent labels                                    | No         |
| `tokenize`     | Random 64-bit token (`<<PII_3f9c1a0b7d2e4c61>>`), restorable via token map  | Yes        |
| `substitute`   | Plausible fake value via `@faker-js/faker` (pass `faker` to `createMasker`) | No         |

## Built-in Detectors

### Contact

- `email` — Email addresses
- `phone-global` — Phone numbers (powered by `libphonenumber-js`, 20+ country local formats)

### Government ID

- `ssn-us` — US Social Security Numbers
- `nin-ng` — Nigerian National Identification Numbers (key or context required)
- `bvn-ng` — Nigerian Bank Verification Numbers (key or context required)
- `aadhaar-in` — Indian Aadhaar numbers (grouped form, or key/context)
- `pan-in` — Indian PAN cards
- `said-za` — South African ID numbers
- `nin-uk` — UK National Insurance Numbers (region `GB`; `UK` also accepted)
- `nik-id` — Indonesian NIK numbers
- `cpf-br` — Brazilian CPF numbers
- `passport` — Passport numbers
- `sin-ca` — Canadian Social Insurance Numbers

### Financial

- `credit-card` — Credit/debit card numbers (issuer range + Luhn)
- `iban` — International Bank Account Numbers

### Network

- `ip-address` — IPv4 addresses
- `ipv6` — IPv6 addresses
- `mac-address` — Hardware MAC addresses

### Biometric

- `dob` — Dates of birth (ISO, MM/DD/YYYY, DD/MM/YYYY, natural language; needs a birth key or context)

### Identity

- `person-name` — Person names (key-name heuristic)
- `address` — Physical addresses (key-name heuristic)
- `uuid` — UUID v1–v5
- `mongodb-objectid` — MongoDB ObjectIds (24-char hex)
- `vin` — Vehicle Identification Numbers

### Secrets

- `secret-key` — Passwords, tokens, API keys, cookies, `Authorization` headers (key-name heuristic)
- `jwt` — JSON Web Tokens
- `bcrypt-hash` — bcrypt password hashes
- `hex-secret` — 32/64-char hex strings (not under trace-ID, checksum or commit keys)
- `aws-key` — AWS access key IDs (AKIA/ASIA prefix)
- `github-pat` — GitHub personal access tokens
- `platform-token` — Slack (xox\*) and Stripe (sk*/rk*) tokens

## Using with AI coding agents

Every package ships [TanStack Intent](https://tanstack.com/intent) skills — task guides that coding agents (Claude Code, Cursor, Copilot …) load on demand, versioned with the package you have installed. After installing the packages, run once in your project:

```bash
npx @tanstack/intent@latest install
```

This adds skill-loading guidance to your agent's config file (e.g. `AGENTS.md`). List or read the skills with `npx @tanstack/intent@latest list` and `npx @tanstack/intent@latest load @pii-mask/core#mask-pii`.

| Package           | Skills                                      |
| ----------------- | ------------------------------------------- |
| `@pii-mask/core`  | `mask-pii`, `mask-logs`, `custom-detectors` |
| `@pii-mask/cli`   | `mask-files`                                |
| `@pii-mask/react` | `mask-pii-react`                            |
| `@pii-mask/nlp`   | `detect-names-in-text`                      |

## Architecture

```
┌─────────────┐   ┌──────────────┐   ┌───────────────┐
│ @pii-mask/  │   │ @pii-mask/   │   │ @pii-mask/    │
│ cli         │   │ react        │   │ nlp           │
└──────┬──────┘   └──────┬───────┘   └───────┬───────┘
       │                 │                    │
       └─────────────────┼────────────────────┘
                         │
                  ┌──────┴──────┐
                  │ @pii-mask/  │
                  │ core        │
                  └─────────────┘
```

All packages depend only on `core`. No circular dependencies.

## Development

```bash
# Prerequisites: Node.js >= 22, pnpm

# Install dependencies
pnpm install

# Build all packages
pnpm turbo build

# Run all tests
pnpm turbo test

# Typecheck
pnpm turbo typecheck

# Lint
pnpm turbo lint
```

> **Always use pnpm.** Never use npm or yarn — this repo uses pnpm workspaces exclusively.

## License

MIT
