---
name: custom-detectors
description: >
  Use when @pii-mask/core misses or over-masks a value: writing a custom
  PIIDetector (pattern, find, prefilter, keyPattern), restricting detectors
  with only/disable/regions/keyNameOnly, or understanding why a value was or
  was not detected.
metadata:
  purpose: >
    Explains how @pii-mask/core decides what is PII and how to extend or
    narrow detection with custom detectors and masker options.
  type: core
  library: '@pii-mask/core'
  library_version: '0.3.0'
sources:
  - src/types.ts
  - src/engine.ts
  - src/registry.ts
  - src/detectors/index.ts
  - src/skills/skills.test.ts
requires:
  - mask-pii
---

# Customize PII detection

Read mask-pii first. This skill covers changing *what* is detected.

## Setup: diagnose first

```ts
import { createMasker } from '@pii-mask/core';

const masker = createMasker();
masker.detectString('2341 2341 2346').detections; // ['aadhaar-in']
masker.detectString('276403465037').detections; // [] — bare 12 digits need a key
masker.detectString('276403465037', 'aadhaar').detections; // ['aadhaar-in']
```

`detectString(value, key?)` returns the detector IDs that would fire. Run it on the value (and key) you think is wrong before changing configuration.

How detection decides, in order:

1. **Whole value** — detectors run in registration order and the first whose `detect(value, key)` returns true masks the whole value.
2. **Key forcing** — if none matched, the value contains a digit and is ID-shaped, a detector whose `keyPattern` matches the key masks it anyway (`{ ssn: '123456789' }`).
3. **Freeform text** — every detector's `pattern`/`find` scans the original string; overlapping matches resolve longest-first, then by registration order.

Ambiguous digit runs, plain dates and bare `name` keys need context by design (see the core README's "How detection decides").

## Core Patterns

### Write a detector for an internal ID

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
  pattern: /\bEMP-\d{6}\b/g, // freeform scanning; must have the g flag
  prefilter: /EMP-/, // cheap test that skips the scan when it can't match
  keyPattern: /^employee_?id$/i, // mask ID-shaped values under this key even if detect() says no
};

const masker = createMasker({ mode: 'redact', extend: [employeeId] });
masker.maskString('ticket from EMP-123456').result; // 'ticket from [REDACTED]'
```

Rules for `mask()`: handle every mode, and use `getOrCreateToken`/`getOrCreateLabel` for tokenize/pseudonymize so restore and sessions work. `detect()` also validates each `pattern` match unless you set `contextualPattern: true` (for patterns whose lookbehind supplies context `detect()` can't see). Use `find(text)` returning `{ start, end }[]` when a regex can't express the matcher.

### Narrow which detectors run

```ts
import { createMasker } from '@pii-mask/core';

createMasker({ only: ['email', 'financial'] }); // detector IDs or categories
createMasker({ disable: ['phone-global', 'uuid'] });
createMasker({ regions: ['NG', 'GB'] }); // region-specific detectors outside these are skipped; 'UK' = 'GB'
createMasker({ keyNameOnly: true }); // only key-named fields (password, first_name …); no value patterns
```

## Common Mistakes

**HIGH — Returning the raw value or a random string in tokenize mode.** `restore()` can't map it back and sessions lose consistency. Use `getOrCreateToken(value, ctx)`. Source: `src/engine.ts`.

**HIGH — A `pattern` without the `g` flag, or with an unanchored leading quantifier.** Core adds `g` if missing, but a pattern like `/[a-z.]+@x/` retried from every position is quadratic on long strings; start matches at a boundary (`(?<![a-z.])`) and add a `prefilter`. Source: `src/detectors/contact/email.ts`.

**MEDIUM — Registering on the global `registry` when only one masker needs the detector.** `registry.register()` affects every masker in the process; prefer `extend`. Source: `src/registry.ts`.

**MEDIUM — Reusing a built-in ID in `extend`.** It silently replaces the built-in detector. Use a new ID unless replacement is intended. Source: `src/registry.ts`.

## Completion

`detectString()` returns your detector's ID for a positive sample and `[]` for a near-miss sample; `maskString()` on text containing the value masks only that span; and in tokenize mode `restore()` returns the original.
