# @pii-mask

A developer-first PII masking toolkit for TypeScript and JavaScript. Detect, mask, tokenize, and anonymize personally identifiable information across structured data, freeform text, CLI pipelines, and React UIs.

## Packages

| Package                               | Description                                                   | Install                     |
| ------------------------------------- | ------------------------------------------------------------- | --------------------------- |
| [`@pii-mask/core`](./packages/core)   | Zero-dependency masking engine with 31 built-in detectors     | `pnpm add @pii-mask/core`   |
| [`@pii-mask/cli`](./packages/cli)     | File I/O adapter for CSV, JSON, JSONL, and TXT files          | `pnpm add -g @pii-mask/cli` |
| [`@pii-mask/react`](./packages/react) | React bindings — `<MaskPII>`, `usePIIMask`, `usePIIMaskTable` | `pnpm add @pii-mask/react`  |
| [`@pii-mask/nlp`](./packages/nlp)     | Optional NLP extension for freeform name/place detection      | `pnpm add @pii-mask/nlp`    |

## Quick Start

```ts
import { createMasker } from '@pii-mask/core';

const masker = createMasker({ mode: 'redact' });

// Structured data
const { result } = masker.maskObject({
  name: 'John Doe',
  email: 'john@example.com',
  ssn: '123-45-6789',
});
// → {"name":"John Doe","email":"[REDACTED]","ssn":"[REDACTED]"}

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

## Masking Modes

| Mode           | Behaviour                                                     | Reversible |
| -------------- | ------------------------------------------------------------- | ---------- |
| `mask`         | Partial obscure — preserves type shape (`jo***n@example.com`) | No         |
| `redact`       | Full replacement with `[REDACTED]`                            | No         |
| `pseudonymize` | Consistent labels per session (`EMAIL_1`, `SSN_2`)            | No         |
| `anonymize`    | Same as pseudonymize — consistent labels                      | No         |
| `tokenize`     | Random token (`<<PII_a1b2c3d4>>`), restorable via token map   | Yes        |
| `substitute`   | Plausible fake value via `@faker-js/faker`                    | No         |

## Built-in Detectors

### Contact

- `email` — Email addresses
- `phone` — Phone numbers (powered by `libphonenumber-js`, 20+ country local formats)

### Government ID

- `ssn-us` — US Social Security Numbers
- `nin-ng` — Nigerian National Identification Numbers
- `bvn-ng` — Nigerian Bank Verification Numbers
- `aadhaar-in` — Indian Aadhaar numbers
- `pan-in` — Indian PAN cards
- `said-za` — South African ID numbers
- `nin-uk` — UK National Insurance Numbers
- `nik-id` — Indonesian NIK numbers
- `cpf-br` — Brazilian CPF numbers
- `passport` — Passport numbers
- `sin-ca` — Canadian Social Insurance Numbers

### Financial

- `credit-card` — Credit/debit card numbers (Luhn-validated)
- `iban` — International Bank Account Numbers

### Network

- `ip-address` — IPv4 addresses
- `ipv6` — IPv6 addresses
- `mac-address` — Hardware MAC addresses

### Biometric

- `dob` — Dates of birth (ISO 8601 and common formats)

### Identity

- `person-name` — Person names (key-name heuristic)
- `address` — Physical addresses (key-name heuristic)
- `uuid` — UUID v1–v5
- `mongodb-objectid` — MongoDB ObjectIds (24-char hex)
- `vin` — Vehicle Identification Numbers

### Secrets

- `secret-key` — API keys, tokens, passwords (key-name heuristic)
- `jwt` — JSON Web Tokens
- `bcrypt-hash` — bcrypt password hashes
- `hex-secret` — Long hex strings (32+ chars)
- `aws-key` — AWS access key IDs (AKIA/ASIA prefix)
- `github-pat` — GitHub personal access tokens
- `platform-token` — Slack (xox\*) and Stripe (sk*/rk*) tokens

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
# Prerequisites: Node.js >= 18, pnpm

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
