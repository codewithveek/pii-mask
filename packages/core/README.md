# @pii-mask/core

The masking engine at the heart of the `@pii-mask` toolkit. Ships 31 built-in PII detectors, six masking modes, a detector registry, structured-data and freeform-text masking, and ready-made pino and winston integrations. Its only runtime dependency is `libphonenumber-js`; it runs in Node.js (>= 22) and in browsers without bundler shims.

## Installation

```bash
pnpm add @pii-mask/core
```

For **substitute** mode (fake data generation), also install the optional peer dependency and pass it in — core never imports it itself:

```bash
pnpm add @faker-js/faker
```

## Quick Start

```ts
import { createMasker } from '@pii-mask/core';

const masker = createMasker(); // defaults to 'mask' mode

const { result, detections } = masker.maskString('john.doe@example.com');
// result:     "jo*****e@example.com"
// detections: ["email"]
```

## API Reference

### `createMasker(options?)`

Factory function that returns a masker instance. Call it once, reuse the returned object.

```ts
import { createMasker } from '@pii-mask/core';

const masker = createMasker({
  mode: 'redact', // 'mask' | 'redact' | 'pseudonymize' | 'anonymize' | 'tokenize' | 'substitute'
  only: ['email', 'ssn-us'], // run only these detector IDs or category names
  disable: ['phone-global'], // disable specific detector IDs
  regions: ['US', 'NG'], // only region-specific detectors for these ISO codes (universal ones always run)
  extend: [myCustomDetector], // add custom detectors
  keyNameOnly: false, // true: only mask fields whose *key* names them as sensitive
  maxDepth: 100, // deeper objects become '[Truncated]'
  faker, // required for mode: 'substitute'
});
```

`createMasker` throws on an unknown `mode`, and on `mode: 'substitute'` without `faker`.

#### `masker.mask(value, session?)`

Mask any value — object, array, string, `Error`, `Map`, `Set` — and get back a masked **copy with the same structure** (no JSON round-trip).

```ts
const { result, detections } = masker.mask({
  user: { email: 'jane@corp.com', ssn: '123-45-6789', age: 30, password: 'hunter2' },
});
// result.user → { email: '[REDACTED]', ssn: '[REDACTED]', age: 30, password: '[REDACTED]' }
```

How values are handled:

| Input                                           | Output                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| Strings                                         | Whole-value detection first, then freeform scanning               |
| Numbers / BigInts                               | Unchanged, unless the key is sensitive (`password`, `ssn`, `phone`, `zip` …) |
| `Date`, objects with `toJSON()`                 | Their JSON form, then masked                                      |
| `Error`                                         | `{ type, message, stack, …own fields }`, masked                   |
| `Map` / `Set`                                   | Plain object / array, masked                                      |
| Credential containers (`cookies: {…}`)          | `'[REDACTED]'` as a whole                                         |
| An object referenced twice                      | Masked at every occurrence                                        |
| A cycle                                         | `'[Circular]'`                                                    |
| `Buffer` / typed arrays                         | Passed through                                                    |

#### `masker.maskString(input, key?, session?)`

Mask a single string. First attempts whole-value detection (is the entire string PII?), then scans freeform text with each detector's `pattern`/`find`.

```ts
masker.maskString('Contact john@example.com or call (415) 823-9042');
// → { result: 'Contact [REDACTED] or call [REDACTED]', detections: ['email', 'phone-global'], tokenMap: {} }
```

- `key` *(optional)* — the object key or column header; enables key-name detection (`password`, `first_name`, `dob` …).

#### `masker.maskObject(input, session?)` / `masker.maskArray(input, session?)`

Same as `mask()`, but `result` is the masked value **serialized as JSON** (BigInts become strings).

```ts
const { result } = masker.maskArray([{ email: 'a@b.com' }, { email: 'c@d.com' }]);
JSON.parse(result); // [{ email: '[REDACTED]' }, { email: '[REDACTED]' }]
```

#### `masker.detectString(input, key?)`

Returns `{ detections }` without masking.

#### Sessions — `masker.createSession()` / `masker.getTokenMap(session)`

Pass one session to several calls and the same value gets the same token or label in all of them:

```ts
const masker = createMasker({ mode: 'pseudonymize' });
const session = masker.createSession();
masker.maskString('john@example.com', undefined, session).result; // 'EMAIL_1'
masker.mask({ backup: 'john@example.com' }, session).result; // { backup: 'EMAIL_1' }
masker.getTokenMap(session); // { EMAIL_1: 'john@example.com' }
```

#### Restoring — `restore`, `restoreValue`, `restoreObject`, `restoreArray`

```ts
const masker = createMasker({ mode: 'tokenize' });
const { result, tokenMap } = masker.maskString('john@example.com');
// result: '<<PII_3f9c1a0b7d2e4c61>>'
masker.restore(result, tokenMap); // 'john@example.com'

const masked = masker.mask({ note: 'mail a@b.com' });
masker.restoreValue(masked.result, masked.tokenMap); // { note: 'mail a@b.com' }

const json = masker.maskObject({ fullName: 'Bob "The" Builder' });
masker.restoreObject(json.result, json.tokenMap); // parsed, then restored — quotes survive
```

Restoration replaces whole tokens in one pass, so `EMAIL_1` never matches inside `EMAIL_10`.

## Masking Modes

### `mask` (default)

Partial obscure that preserves the type shape.

```ts
const masker = createMasker({ mode: 'mask' });
masker.maskString('john.doe@example.com'); // → 'jo*****e@example.com'
masker.maskString('jane@example.com'); // → 'j***@example.com' (short local parts reveal one character)
masker.maskString('4111111111111111'); // → '4111-XXXX-XXXX-1111'
masker.maskString('123-45-6789'); // → '***-**-6789'
```

### `redact`

Full replacement. Every PII value becomes `[REDACTED]`.

### `pseudonymize` / `anonymize`

Consistent labels, numbered per type: `EMAIL_1`, `EMAIL_2`, `PHONE_1` … The same value maps to the same label within a call, or across calls that share a session.

```ts
const masker = createMasker({ mode: 'pseudonymize' });
masker.mask({ primary: 'john@example.com', backup: 'jane@corp.com', confirm: 'john@example.com' });
// → { primary: 'EMAIL_1', backup: 'EMAIL_2', confirm: 'EMAIL_1' }
```

### `tokenize`

Random 64-bit tokens (`<<PII_` + 16 hex chars + `>>`), generated with Web Crypto and checked for collisions within a token map. Reversible via the returned token map.

### `substitute`

Plausible fake values from `@faker-js/faker`, which you pass in:

```ts
import { faker } from '@faker-js/faker';

const masker = createMasker({ mode: 'substitute', faker });
masker.maskString('john@example.com'); // → 'dakota.johnson@gmail.com' (random)
```

> **Secret-category detectors** always return `[REDACTED]`, whatever the mode.

## Logging Integrations

No extra dependencies — these work with the pino and winston you already have.

### pino

```ts
import pino from 'pino';
import { pinoMask, maskedDestination } from '@pii-mask/core';

// In-process: masks the merging object, the message, interpolation args and
// logged Errors (keeping their type, message and stack).
const logger = pino({ ...pinoMask({ mode: 'redact' }) });

// Or mask each serialized line just before it's written. This also covers
// child-logger bindings, which pino never passes to formatters.
const logger2 = pino({}, maskedDestination(process.stdout, { mode: 'redact' }));
```

`maskedDestination(stream, options)` works with any NDJSON logger; non-JSON lines are masked as text.

### winston

```ts
import winston from 'winston';
import { winstonMask } from '@pii-mask/core';

const logger = winston.createLogger({
  format: winston.format.combine(winstonMask({ mode: 'redact' }), winston.format.json()),
  transports: [new winston.transports.Console()],
});

logger.error(new Error('failed for jane@acme.com'));
// {"level":"error","message":"failed for [REDACTED]","stack":"Error: failed for [REDACTED]\n …"}
```

All three accept either `MaskOptions` or an existing masker.

Performance: masking a typical HTTP log record takes about 90–100 µs (about 10,000 records/s per core) in `mask`/`redact` mode.

## How detection decides

Detection is tuned to avoid masking ordinary data in logs and exports:

- **Ambiguous digit runs need context.** A bare 10–19 digit number (order IDs, timestamps, snowflake IDs) is not treated as a phone, card or national ID. Cards need a Luhn-valid number in a real issuer range; NIN/BVN need a matching key (`nin`, `bvn`); a bare 12-digit Aadhaar needs an `aadhaar` key (the grouped `2341 2341 2346` form is detected anywhere).
- **Phones** are detected with a `+` prefix, a leading trunk `0` (valid for a supported country), or US/CA formatting like `(415) 823-9042`. Under a phone-like key (`phone`, `mobile`, `msisdn` …) any digit value is masked.
- **Dates of birth** need a birth-related key (`dob`, `birthDate` …) or, in text, a context word (`born`, `date of birth`, `DOB`) just before the date. Other dates are left alone.
- **Key names** are normalized (`first_name` = `firstName` = `First-Name`) and matched exactly, not by substring — `capacity` isn't a city and `secretary` isn't a secret. A bare `name` key is only treated as a person when the value looks like one (`Jane Doe`).
- **Sensitive keys force masking** of ID-shaped values a format check would miss: `{ ssn: '123456789' }`, `{ vin: <non-North-American VIN> }`, `{ zip: 94107 }`.
- **Freeform text** is scanned once by every detector; overlapping matches are resolved (longest wins), so masked output is never re-scanned.

Known limitation: a leading-zero number that is a valid local phone number somewhere (`08034567890`) is masked as a phone even if it's an ID — that's the trade-off for detecting local formats.

## Filtering Detectors

```ts
createMasker({ only: ['email', 'ssn-us'] }); // by detector ID
createMasker({ only: ['financial'] }); // by category
createMasker({ disable: ['phone-global', 'dob'] });
createMasker({ regions: ['GB'] }); // 'UK' is accepted as an alias
```

## Custom Detectors

Register additional detectors via the `extend` option:

```ts
import { createMasker, getOrCreateToken, getOrCreateLabel, PIICategory, MaskMode } from '@pii-mask/core';
import type { PIIDetector } from '@pii-mask/core';

const employeeId: PIIDetector = {
  id: 'employee-id',
  label: 'Employee ID',
  category: PIICategory.IDENTITY,

  detect: (value) => /^EMP-\d{6}$/.test(value.trim()),

  mask(value, mode, ctx) {
    if (mode === MaskMode.REDACT) return '[REDACTED]';
    if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
    if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
      return getOrCreateLabel('EMPLOYEE', value, ctx);
    }
    if (mode === MaskMode.SUBSTITUTE) return `EMP-${ctx.faker?.string.numeric(6) ?? '000000'}`;
    return `EMP-***${value.slice(-3)}`;
  },

  // Optional: freeform text scanning (needs the 'g' flag). detect() validates each match.
  pattern: /\bEMP-\d{6}\b/g,
  // Optional: cheap test that skips the scan when it can't match
  prefilter: /EMP-/,
  // Optional: mask any ID-shaped value under these keys, even if detect() says no
  keyPattern: /^employee_?id$/i,
};

const masker = createMasker({ extend: [employeeId] });
```

Other optional fields:

- `contextualPattern: true` — the `pattern` already encodes the context (e.g. a lookbehind for "passport number"), so `detect()` isn't used as a gate.
- `find(text)` — return `{ start, end }` ranges instead of a regex, for matchers a regex can't express (used by `@pii-mask/nlp`).

## Registry

The singleton registry holds all registered detectors. Detectors self-register on import, and registration order is priority order.

```ts
import { registry } from '@pii-mask/core';

registry.list(); // all registered detectors
registry.resolve({ only: ['email'] });
registry.register(myDetector, { override: true }); // replace silently
```

## Built-in Detectors

| ID | Category | Regions | Description |
|----|----------|---------|-------------|
| `email` | contact | — | Email addresses |
| `phone-global` | contact | — | Phone numbers (libphonenumber-js) |
| `ssn-us` | gov-id | US | Social Security Numbers |
| `sin-ca` | gov-id | CA | Canadian SIN (Luhn-validated, formatted) |
| `cpf-br` | gov-id | BR | Brazilian CPF (checksum-validated) |
| `nin-uk` | gov-id | GB | National Insurance Numbers (HMRC prefix rules) |
| `pan-in` | gov-id | IN | PAN cards (AAAAA0000A) |
| `aadhaar-in` | gov-id | IN | Aadhaar numbers (Verhoeff-validated) |
| `said-za` | gov-id | ZA | South African ID (date, citizenship and Luhn validated) |
| `nik-id` | gov-id | ID | Indonesian NIK (province and date validated) |
| `nin-ng` | gov-id | NG | Nigerian NIN (key or context required) |
| `bvn-ng` | gov-id | NG | Nigerian BVN (key or context required) |
| `passport` | gov-id | — | Passport numbers (key or context required) |
| `credit-card` | financial | — | Credit/debit cards (issuer range + Luhn) |
| `iban` | financial | — | IBANs (mod-97), compact or spaced |
| `ip-address` | network | — | IPv4 addresses |
| `ipv6` | network | — | IPv6 addresses, including compressed forms |
| `mac-address` | network | — | MAC addresses |
| `dob` | biometric | — | Dates of birth (key or context required) |
| `person-name` | identity | — | Person names (key-name heuristic) |
| `address` | identity | — | Physical addresses (key-name heuristic) |
| `uuid` | identity | — | UUID v1–v5 |
| `mongodb-objectid` | identity | — | MongoDB ObjectIds |
| `vin` | identity | — | Vehicle Identification Numbers |
| `secret-key` | secret | — | Passwords, tokens, API keys, cookies, `Authorization` headers (key-name heuristic) |
| `jwt` | secret | — | JSON Web Tokens |
| `bcrypt-hash` | secret | — | bcrypt hashes |
| `hex-secret` | secret | — | 32/64-char hex strings (not under trace-ID, checksum or commit keys) |
| `aws-key` | secret | — | AWS access key IDs |
| `github-pat` | secret | — | GitHub tokens |
| `platform-token` | secret | — | Slack and Stripe tokens |

## Types

```ts
import type { PIIDetector, MaskContext, MaskResult, MaskOptions, MaskSession, Masker } from '@pii-mask/core';
import { PIICategory, MaskMode } from '@pii-mask/core';
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
