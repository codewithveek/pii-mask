---
name: mask-pii
description: >
  Use when masking, redacting, pseudonymizing, tokenizing or substituting PII
  (emails, phones, card numbers, government IDs, secrets) in strings, objects,
  arrays, API payloads or database exports with @pii-mask/core, or restoring
  tokenized data. Not for logger setup (mask-logs) or writing new detectors
  (custom-detectors).
metadata:
  purpose: >
    Explains how to create a masker, pick a masking mode, mask strings and
    structured values, keep labels consistent with sessions, and restore
    tokenized output with @pii-mask/core.
  type: core
  library: '@pii-mask/core'
  library_version: '0.3.0'
sources:
  - src/masker.ts
  - src/engine.ts
  - src/types.ts
  - README.md
  - src/skills/skills.test.ts
---

# Mask PII with @pii-mask/core

## Setup

```ts
import { createMasker } from '@pii-mask/core';

// Create once and reuse: detector resolution happens here, not per call.
const masker = createMasker({ mode: 'redact' });

const { result, detections } = masker.mask({
  user: { email: 'jane@corp.com', ssn: '123-45-6789', age: 30, pin: 4821 },
});
// result      → { user: { email: '[REDACTED]', ssn: '[REDACTED]', age: 30, pin: '[REDACTED]' } }
// detections  → ['email', 'ssn-us', 'secret-key']
```

Check: `result` has the input's shape, PII fields are replaced, and non-PII values (`age`) are unchanged.

## Core Patterns

### Choose the mode

| Mode | Output | Reversible |
| --- | --- | --- |
| `mask` (default) | Partial: `jo*****e@example.com`, `***-**-6789` | No |
| `redact` | `[REDACTED]` | No |
| `pseudonymize` / `anonymize` | `EMAIL_1`, `PHONE_1` (numbered per type) | Only with the token map |
| `tokenize` | `<<PII_` + 16 hex + `>>` | Yes, with the token map |
| `substitute` | Fake value from faker | No |

Secret detectors (`secret-key`, `jwt`, `aws-key` …) always output `[REDACTED]`, whatever the mode.

### Mask structured data: `mask()`, not `maskObject()`

`mask(value)` returns a masked copy with the same structure. `maskObject()` and `maskArray()` do the same walk but return `result` as a JSON string.

```ts
import { createMasker } from '@pii-mask/core';

const masker = createMasker();
const payload = { contact: { email: 'jane@corp.com' }, createdAt: new Date('2024-01-15') };

const { result } = masker.mask(payload);
// result.contact.email → 'j***@corp.com'; createdAt becomes its ISO string
```

The walker handles values JSON can't: `Date` and `toJSON()` objects are masked in JSON form, `Error` becomes `{ type, message, stack }`, `Map`/`Set` become object/array, cycles become `'[Circular]'`, and objects deeper than `maxDepth` (default 100) become `'[Truncated]'`. Numbers are only masked under sensitive keys (`pin`, `ssn`, `phone`, `zip` …).

### Mask a string, with a key hint when you have one

```ts
import { createMasker } from '@pii-mask/core';

const masker = createMasker({ mode: 'redact' });
masker.maskString('Contact john@example.com or call (415) 823-9042').result;
// → 'Contact [REDACTED] or call [REDACTED]'

// The key (object key / CSV header) enables key-based detection
masker.maskString('123456789', 'ssn').result; // → '[REDACTED]'
masker.maskString('123456789').result; // → '123456789' (bare digits alone are not PII)
```

### Tokenize and restore

```ts
import { createMasker } from '@pii-mask/core';

const masker = createMasker({ mode: 'tokenize' });

const { result, tokenMap } = masker.mask({ note: 'mail a@b.com', fullName: 'Bob "The" Builder' });
const original = masker.restoreValue(result, tokenMap);
// original → { note: 'mail a@b.com', fullName: 'Bob "The" Builder' }
```

For JSON strings from `maskObject()` use `restoreObject(json, tokenMap)`; for a plain string, `restore(text, tokenMap)`. The token map holds the original PII — store it like a secret.

### Keep labels consistent across calls with a session

```ts
import { createMasker } from '@pii-mask/core';

const masker = createMasker({ mode: 'pseudonymize' });
const session = masker.createSession();

masker.maskString('john@example.com', undefined, session).result; // 'EMAIL_1'
masker.mask({ backup: 'john@example.com' }, session).result; // { backup: 'EMAIL_1' }
masker.getTokenMap(session); // { EMAIL_1: 'john@example.com' }
```

Without a session, every call starts numbering from 1 again.

### Substitute mode needs faker passed in

```ts
import { faker } from '@faker-js/faker';
import { createMasker } from '@pii-mask/core';

const masker = createMasker({ mode: 'substitute', faker });
masker.maskString('john@example.com').result; // a random fake email
```

Install `@faker-js/faker` >= 10.5.0 yourself; core never imports it.

## Common Mistakes

**CRITICAL — Calling `createMasker({ mode: 'substitute' })` without `faker`.** It throws `mode "substitute" needs a faker instance`. Pass `faker` as shown above. Source: `src/masker.ts`.

**HIGH — Treating `maskObject().result` as an object.** It is a JSON string; `result.email` is `undefined`. Use `mask()` for an object, or `JSON.parse` the string. Source: `src/masker.ts`.

**HIGH — Masking each record with a separate call in pseudonymize/tokenize mode and expecting stable labels.** Each call numbers from `EMAIL_1` again, so different people collide on the same label. Share one `createSession()` across the calls. Source: `src/masker.ts`.

**HIGH — Expecting bare numbers, plain dates or `name` fields to always be masked.** Detection deliberately needs context for ambiguous values: a bare 10–19 digit number is not a phone or ID, a date is a date of birth only under a birth key (`dob`) or after "born"/"date of birth", and a bare `name` key only counts when the value looks like a person ("Jane Doe"). Pass the field key (`maskString(value, key)`), or use structured `mask()` so keys are passed automatically. Source: `README.md` "How detection decides".

**MEDIUM — Restoring JSON text with `restore()` after string manipulation.** Originals containing quotes or backslashes break JSON when spliced back as text. Use `restoreObject()` (parses first) or `restoreValue()` on `mask()` output. Source: `src/engine.ts` `restoreDeep`.

## Completion

The task is done when the masked output contains none of the original PII values (assert with `JSON.stringify(result).includes(original) === false`), non-PII fields are unchanged, and — for tokenize — `restoreValue(result, tokenMap)` deep-equals the input. If a value you consider PII is not masked, pass its key or see the custom-detectors skill.
