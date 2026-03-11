# @pii-mask/core

The masking engine at the heart of the `@pii-mask` toolkit. Ships 22 built-in PII detectors, six masking modes, a detector registry, and both structured-data and freeform-text masking — all with zero required runtime dependencies beyond `libphonenumber-js`.

## Installation

```bash
pnpm add @pii-mask/core
```

For **substitute** mode (fake data generation), also install the optional peer dependency:

```bash
pnpm add @faker-js/faker
```

## Quick Start

```ts
import { createMasker } from '@pii-mask/core';

const masker = createMasker(); // defaults to 'mask' mode

const { result, detections } = masker.maskString('john@example.com');
// result:     "jo***n@example.com"
// detections: ["email"]
```

## API Reference

### `createMasker(options?)`

Factory function that returns a masker instance. Call it once, reuse the returned object.

```ts
import { createMasker } from '@pii-mask/core';

const masker = createMasker({
  mode: 'redact',         // 'mask' | 'redact' | 'pseudonymize' | 'anonymize' | 'tokenize' | 'substitute'
  only: ['email', 'ssn-us'],  // run only these detector IDs or category names
  disable: ['phone'],          // disable specific detector IDs
  extend: [myCustomDetector],  // add custom detectors to the registry
  keyNameOnly: false,          // skip value-level regex; rely on key-name heuristics only
});
```

#### `masker.maskString(input, key?)`

Mask a single string value. First attempts atomic detection (is the whole string PII?), then falls back to freeform text scanning using detector `pattern` regexes.

```ts
// Atomic value
masker.maskString('john@example.com');
// → { result: '[REDACTED]', detections: ['email'], tokenMap: {} }

// Freeform text with inline PII
masker.maskString('Contact john@example.com or call 555-0123');
// → { result: 'Contact [REDACTED] or call [REDACTED]', detections: ['email', 'phone'], tokenMap: {} }
```

**Parameters:**
- `input` — The string to mask
- `key` *(optional)* — Object key or column header, used by key-name heuristic detectors

**Returns:** `MaskResult`
- `result` — The masked string
- `tokenMap` — In `tokenize` mode, maps `token → original` for restoration
- `detections` — Array of detector IDs that fired

#### `masker.maskObject(input)`

Recursively walk a plain object, masking all string values.

```ts
const { result, detections } = masker.maskObject({
  user: {
    email: 'jane@corp.com',
    ssn: '123-45-6789',
    age: 30,
  },
});

const parsed = JSON.parse(result);
// parsed.user.email → '[REDACTED]'
// parsed.user.ssn   → '[REDACTED]'
// parsed.user.age   → 30  (non-string, untouched)
```

**Parameters:**
- `input` — A `Record<string, unknown>` to walk

**Returns:** `MaskResult` (result is a JSON string)

#### `masker.maskArray(input)`

Recursively walk an array of objects, masking all string values.

```ts
const { result } = masker.maskArray([
  { email: 'a@b.com' },
  { email: 'c@d.com' },
]);

const parsed = JSON.parse(result);
// parsed[0].email → '[REDACTED]'
// parsed[1].email → '[REDACTED]'
```

#### `masker.restore(masked, tokenMap)`

Reverse tokenization. Only works when masking was done in `tokenize` mode.

```ts
const masker = createMasker({ mode: 'tokenize' });
const { result, tokenMap } = masker.maskString('john@example.com');
// result: '<<PII_a1b2c3d4>>'

const original = masker.restore(result, tokenMap);
// original: 'john@example.com'
```

## Masking Modes

### `mask` (default)

Partial obscure that preserves the type shape.

```ts
const masker = createMasker({ mode: 'mask' });
masker.maskString('john@example.com');    // → 'jo***n@example.com'
masker.maskString('4111111111111111');     // → '****-****-****-1111'
masker.maskString('123-45-6789');          // → '***-**-6789'
```

### `redact`

Full replacement. Every PII value becomes `[REDACTED]`.

```ts
const masker = createMasker({ mode: 'redact' });
masker.maskString('john@example.com');    // → '[REDACTED]'
```

### `pseudonymize` / `anonymize`

Replaces PII with consistent labels per session. The same value always maps to the same label within a single `maskObject`/`maskArray` call.

```ts
const masker = createMasker({ mode: 'pseudonymize' });
masker.maskObject({
  primary: 'john@example.com',
  backup: 'jane@corp.com',
  confirm: 'john@example.com',
});
// primary → 'EMAIL_1', backup → 'EMAIL_2', confirm → 'EMAIL_1'
```

### `tokenize`

Generates cryptographically random tokens. Reversible via the returned token map.

```ts
const masker = createMasker({ mode: 'tokenize' });
const { result, tokenMap } = masker.maskString('john@example.com');
// result: '<<PII_a1b2c3d4>>'

masker.restore(result, tokenMap);
// → 'john@example.com'
```

Tokens are generated using `node:crypto` `randomBytes` — never `Math.random()`.

### `substitute`

Generates plausible fake values using `@faker-js/faker`. Requires `@faker-js/faker` as a peer dependency.

```ts
const masker = createMasker({ mode: 'substitute' });
masker.maskString('john@example.com');    // → 'dakota.johnson@gmail.com' (random)
masker.maskString('123-45-6789');          // → '987-65-4321' (random)
```

## Filtering Detectors

### Run only specific detectors

```ts
// By detector ID
const masker = createMasker({ only: ['email', 'ssn-us'] });

// By category — runs all detectors in that category
const masker = createMasker({ only: ['financial'] });
```

### Disable specific detectors

```ts
const masker = createMasker({ disable: ['phone', 'dob'] });
```

## Custom Detectors

Register additional detectors via the `extend` option:

```ts
import { createMasker, PIICategory, MaskMode } from '@pii-mask/core';
import type { PIIDetector } from '@pii-mask/core';

const myDetector: PIIDetector = {
  id: 'custom-id',
  label: 'My Custom PII',
  category: PIICategory.GOV_ID,
  regions: ['XX'],

  detect(value, key) {
    return /^\d{10}$/.test(value);
  },

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('CUSTOM', value, ctx);
    }
    if (mode === MaskMode.SUBSTITUTE) {
      return ctx.faker?.string.numeric(10) ?? '0000000000';
    }
    return `******${value.slice(-4)}`;
  },

  // Optional: enables freeform text scanning (must have 'g' flag)
  pattern: /\b\d{10}\b/g,
};

const masker = createMasker({ extend: [myDetector] });
```

### `pattern` property

When a detector has a `pattern` regex (with the `g` flag), `maskString()` can find and replace occurrences within freeform text. Without `pattern`, the detector only works on atomic field values (whole-string matches via `detect()`).

The `detect()` function is still called as a secondary validation gate on each `pattern` match, so detectors with checksums (like credit cards, CPF, Aadhaar) still validate correctly.

## Registry

The singleton registry holds all registered detectors. Detectors self-register on import.

```ts
import { registry } from '@pii-mask/core';

// List all registered detectors
const all = registry.list();
// → [{ id: 'email', ... }, { id: 'phone', ... }, ...]

// Resolve with filtering
const filtered = registry.resolve({ only: ['email'], disable: [] });
```

### Override behaviour

```ts
// Accidental double-registration — warns, then replaces
registry.register(myDetector);
registry.register(myDetector); // ⚠ console.warn

// Intentional override — silent
registry.register(myDetector, { override: true }); // ✓ silent
```

## Built-in Detectors

| ID | Category | Regions | Description |
|----|----------|---------|-------------|
| `email` | contact | — | Email addresses |
| `phone` | contact | — | Phone numbers (libphonenumber-js) |
| `ssn-us` | gov-id | US | Social Security Numbers |
| `nin-ng` | gov-id | NG | Nigerian NIN (11 digits) |
| `bvn-ng` | gov-id | NG | Nigerian BVN (11 digits, key-gated) |
| `aadhaar-in` | gov-id | IN | Aadhaar numbers (Verhoeff-validated) |
| `pan-in` | gov-id | IN | PAN cards (AAAAA0000A) |
| `said-za` | gov-id | ZA | South African ID (Luhn-validated) |
| `nin-uk` | gov-id | GB | National Insurance Numbers |
| `nik-id` | gov-id | ID | Indonesian NIK (16 digits) |
| `cpf-br` | gov-id | BR | Brazilian CPF (checksum-validated) |
| `credit-card` | financial | — | Credit/debit cards (Luhn-validated) |
| `iban` | financial | — | IBANs (ISO 13616) |
| `ip-address` | network | — | IPv4 addresses |
| `ipv6` | network | — | IPv6 addresses |
| `dob` | biometric | — | Dates of birth |
| `person-name` | identity | — | Person names (key-name heuristic) |
| `address` | identity | — | Physical addresses (key-name heuristic) |
| `secret-key` | secret | — | API keys, passwords (key-name heuristic) |
| `jwt` | secret | — | JSON Web Tokens |
| `bcrypt-hash` | secret | — | bcrypt hashes |
| `hex-secret` | secret | — | Long hex strings (32+ chars) |

> **Secret-category detectors** always return `[REDACTED]` regardless of masking mode.

## Types

```ts
import type {
  PIIDetector,
  MaskContext,
  MaskResult,
  MaskOptions,
} from '@pii-mask/core';

import { PIICategory, MaskMode } from '@pii-mask/core';

// Categories: 'gov-id' | 'financial' | 'contact' | 'secret' | 'biometric' | 'network' | 'identity'
// Modes: 'mask' | 'redact' | 'pseudonymize' | 'anonymize' | 'tokenize' | 'substitute'
```

## Lexicon Data

Regional name lexicons for identity detectors:

```ts
import '@pii-mask/core/lexicon/africa';
import '@pii-mask/core/lexicon/south-asia';
import '@pii-mask/core/lexicon/east-asia';
```

## License

MIT
