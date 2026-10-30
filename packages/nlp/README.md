# @pii-mask/nlp

Optional NLP extension for `@pii-mask/core`. Uses [compromise](https://github.com/spencermountain/compromise) to find person names, places and organizations in unstructured text — cases where regex-based detectors can't help.

## Installation

```bash
pnpm add @pii-mask/nlp compromise
```

**Peer dependency:** `@pii-mask/core`

```bash
pnpm add @pii-mask/core
```

## When to Use This

The built-in `person-name` and `address` detectors in `@pii-mask/core` work via **key-name heuristics** — they fire when the object key is `name`, `firstName`, `address`, etc. This works well for structured data (JSON, CSV) where field names are known.

`@pii-mask/nlp` solves a different problem: detecting person names and places **in the value itself**, using NLP entity recognition. Use it when:

- You have freeform text (support tickets, chat logs, LLM outputs)
- Field names are generic or absent (plain text, unlabeled arrays)
- You need to catch names that aren't in a known-keys list

## Quick Start

```ts
import { createMasker } from '@pii-mask/core';
import { buildCompromiseDetectors } from '@pii-mask/nlp';

const nlpDetectors = buildCompromiseDetectors({
  confidence: 0.7,
  entities: ['Person', 'Place'],
});

const masker = createMasker({
  mode: 'redact',
  extend: nlpDetectors,
});

const { result } = masker.maskString('John Smith lives in New York');
// → '[REDACTED] lives in [REDACTED]'
```

## API Reference

### `buildCompromiseDetectors(options?)`

Builds an array of `PIIDetector` objects for use with `createMasker({ extend: [...] })`. These detectors use compromise's NLP engine to identify entities.

```ts
import { buildCompromiseDetectors } from '@pii-mask/nlp';

const detectors = buildCompromiseDetectors({
  confidence: 0.7,
  entities: ['Person', 'Place'],
  customLexicon: {
    'Acme Corp': 'Organization',
  },
});
```

#### Options

| Option          | Type                                                    | Default               | Description                                                                                                                    |
| --------------- | ------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `confidence`    | `number`                                                | `0.7`                 | For whole-value detection: minimum share of the value the entity must cover (0–1). Freeform text always masks just the entity. |
| `entities`      | `Array<'Person' \| 'Place' \| 'Organization'>`          | `['Person', 'Place']` | Entity types to detect                                                                                                         |
| `customLexicon` | `Record<string, 'Person' \| 'Place' \| 'Organization'>` | `{}`                  | Extra terms to detect, matched as whole words (case-insensitive)                                                               |

#### Returns

`PIIDetector[]` — pass directly to `createMasker({ extend: [...] })`.

The returned detectors:

- **Do not self-register** in the global registry — they are consumer-supplied extensions only
- Use `getOrCreateToken` and `getOrCreateLabel` from `@pii-mask/core` for consistent tokenization
- Support all six masking modes
- Work on whole values (`detect`) and inside freeform text (`find`): in a sentence only the entity is replaced, never the whole string

### `buildPersonDetector(confidence?)`

Builds a single person-name detector. Use this when you only need person detection without places.

```ts
import { buildPersonDetector } from '@pii-mask/nlp';

const personDetector = buildPersonDetector(0.8);

const masker = createMasker({
  mode: 'pseudonymize',
  extend: [personDetector],
});

masker.maskString('Jane Doe');
// → 'PERSON_1'
```

#### Parameters

- `confidence` _(optional, default: 0.7)_ — Minimum ratio threshold

### `buildPlaceDetector(confidence?)`

Builds a single place/location detector.

```ts
import { buildPlaceDetector } from '@pii-mask/nlp';

const placeDetector = buildPlaceDetector();

const masker = createMasker({
  mode: 'redact',
  extend: [placeDetector],
});

masker.maskString('Paris');
// → '[REDACTED]'
```

## Detector IDs

| ID                 | Entity       | Description                                                                       |
| ------------------ | ------------ | --------------------------------------------------------------------------------- |
| `nlp-person`       | Person       | Names detected by compromise's `.people()`                                        |
| `nlp-place`        | Place        | Locations detected by compromise's `.places()`                                    |
| `nlp-organization` | Organization | Organizations detected by compromise's `.organizations()` (opt in via `entities`) |

## Custom Lexicon

Add terms compromise doesn't know with `customLexicon`. Entries are matched as whole words, case-insensitively, alongside compromise's own results. Each set of detectors keeps its own lexicon — compromise's built-in lexicon options change its global state for every caller, so they are not used.

```ts
const detectors = buildCompromiseDetectors({
  entities: ['Person', 'Place', 'Organization'],
  customLexicon: {
    Wakanda: 'Place',
    JARVIS: 'Person',
    'Stark Industries': 'Organization',
  },
});

createMasker({ mode: 'redact', extend: detectors }).maskString(
  'JARVIS flew to Wakanda for Stark Industries',
);
// → '[REDACTED] flew to [REDACTED] for [REDACTED]'
```

## Masking Modes

All NLP detectors support every masking mode:

| Mode           | Person output                         | Place output                       |
| -------------- | ------------------------------------- | ---------------------------------- |
| `mask`         | `J*** D**` (each word's first letter) | `P****` (each word's first letter) |
| `redact`       | `[REDACTED]`                          | `[REDACTED]`                       |
| `pseudonymize` | `PERSON_1`                            | `PLACE_1`                          |
| `anonymize`    | `PERSON_1`                            | `PLACE_1`                          |
| `tokenize`     | `<<PII_3f9c1a0b7d2e4c61>>`            | `<<PII_a07e55d1c94b2f38>>`         |
| `substitute`   | Random full name via faker            | Random city name via faker         |

Organizations use the `ORG_N` label and a random company name in `substitute` mode (pass `faker` to `createMasker`).

## Combining with Core Detectors

NLP detectors complement — not replace — core detectors. Use both together:

```ts
import { createMasker } from '@pii-mask/core';
import { buildCompromiseDetectors } from '@pii-mask/nlp';

const masker = createMasker({
  mode: 'redact',
  extend: buildCompromiseDetectors(),
});

// Core detectors catch structured PII (emails, SSNs, etc.)
// NLP detectors catch names and places in freeform text
const { result } = masker.maskObject({
  email: 'john@example.com', // caught by core 'email' detector
  notes: 'Spoke with Jane Doe', // caught by NLP 'nlp-person' detector
});
```

## Important Notes

- **Never import `@pii-mask/nlp` from core, cli, or react.** NLP is always a consumer-supplied peer, never a dependency of other packages.
- Token generation uses `generateToken`, `getOrCreateToken`, and `getOrCreateLabel` from `@pii-mask/core` — never local reimplementations.
- The compromise library adds ~200KB to your bundle. Only install this package if you need NLP-based detection.
- NLP parsing is much slower than regex detection. Recent parses are cached so each string is parsed once per masking call, but expect NLP to dominate the cost when masking large volumes.

## License

MIT
