---
name: detect-names-in-text
description: >
  Use when person names, places or organizations in free text (support
  tickets, chat logs, LLM prompts or outputs, notes) must be masked with
  @pii-mask/nlp's compromise-based detectors alongside @pii-mask/core,
  including adding custom lexicon terms.
metadata:
  purpose: >
    Shows how to add @pii-mask/nlp's person, place and organization detectors
    to a masker, tune them, and teach them names compromise doesn't know.
  type: core
  library: '@pii-mask/nlp'
  library_version: '1.0.0'
sources:
  - src/entity.ts
  - src/compromise-adapter.ts
  - README.md
  - src/skills.test.ts
  - src/compromise-adapter.test.ts
requires:
  - '@pii-mask/core#mask-pii'
---

# Mask names, places and organizations in free text

Read `@pii-mask/core#mask-pii` first. Core's `person-name` and `address` detectors only use field keys; this package finds entities inside the text itself.

## Setup

```ts
import { createMasker } from '@pii-mask/core';
import { buildCompromiseDetectors } from '@pii-mask/nlp';

const masker = createMasker({ mode: 'redact', extend: buildCompromiseDetectors() });

masker.maskString('John Smith lives in New York').result;
// → '[REDACTED] lives in [REDACTED]'
```

Install `@pii-mask/nlp @pii-mask/core compromise`. Defaults: `entities: ['Person', 'Place']`, `confidence: 0.7`. Core detectors (email, phone, cards …) still run.

## Core Patterns

### Choose entities and confidence

```ts
import { buildCompromiseDetectors } from '@pii-mask/nlp';

const detectors = buildCompromiseDetectors({
  entities: ['Person', 'Place', 'Organization'],
  confidence: 0.8,
});
```

`confidence` only affects whole-value detection: the entity must cover that share of the value for the whole value to be replaced. In longer text only the entity span is masked. Detector IDs: `nlp-person`, `nlp-place`, `nlp-organization`.

### Teach it names it misses

compromise misses many non-English names. Add them with `customLexicon` (whole-word, case-insensitive):

```ts
import { createMasker } from '@pii-mask/core';
import { buildCompromiseDetectors } from '@pii-mask/nlp';

const masker = createMasker({
  mode: 'redact',
  extend: buildCompromiseDetectors({ entities: ['Person'], customLexicon: { emeka: 'Person', okafor: 'Person' } }),
});
masker.maskString('ticket from Emeka Okafor').result; // 'ticket from [REDACTED]'
```

Each `buildCompromiseDetectors()` call keeps its own lexicon. For common African, South Asian and East Asian names, spread the regional lexicons that ship with core:

```ts
import { createMasker } from '@pii-mask/core';
import { africanNames, africanSurnames } from '@pii-mask/core/lexicon/africa';
import { buildCompromiseDetectors } from '@pii-mask/nlp';

const masker = createMasker({
  mode: 'redact',
  extend: buildCompromiseDetectors({ customLexicon: { ...africanNames, ...africanSurnames } }),
});
```

The others are `southAsianNames`/`southAsianSurnames` from `@pii-mask/core/lexicon/south-asia` and `eastAsianNames`/`eastAsianSurnames` from `@pii-mask/core/lexicon/east-asia`.

## Common Mistakes

**HIGH — Assuming NLP finds every name.** Detection is statistical and English-centric: "Emeka Okafor" is not found without a lexicon entry, and capitalised non-names can be flagged. Add known names to `customLexicon` and keep structured fields keyed (`first_name`) so core's key detection also applies. Source: `src/entity.ts`.

**MEDIUM — Calling `nlp.extend()` or `nlp(text, lexicon)` on compromise directly to add names.** Both change compromise's global state for every later call in the process. Use `customLexicon`. Source: `src/entity.ts`.

**MEDIUM — Running NLP detectors over large volumes without measuring.** Parsing costs far more than regex detection. Restrict them with `only`/`extend` to the fields that need them, or run a separate masker for free-text fields.

## Completion

For a sample sentence, `maskString(...).detections` includes the expected `nlp-*` IDs, the result no longer contains the names, and the surrounding words are unchanged. Repeat with a sentence containing no names: the result must equal the input.
