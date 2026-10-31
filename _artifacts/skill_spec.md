# pii-mask — Skill Spec

pii-mask detects and masks personally identifiable information and secrets in strings, structured data, logs, files and React UIs. `@pii-mask/core` is the engine; `@pii-mask/cli`, `@pii-mask/react` and `@pii-mask/nlp` build on it.

## Domains

| Domain    | Description                                                     | Skills               |
| --------- | --------------------------------------------------------------- | -------------------- |
| masking   | Modes, masking strings and structured values, sessions, restore | mask-pii             |
| logging   | Keeping PII out of pino and winston output                      | mask-logs            |
| detection | What counts as PII, custom detectors, narrowing detection       | custom-detectors     |
| cli       | Masking files and pipes from the command line                   | mask-files           |
| react     | Displaying masked values in React                               | mask-pii-react       |
| nlp       | Names, places and organizations in free text                    | detect-names-in-text |

## Skill Inventory

| Skill                | Type      | Domain    | What it covers                                                     | Failure modes |
| -------------------- | --------- | --------- | ------------------------------------------------------------------ | ------------- |
| mask-pii             | core      | masking   | createMasker, mask/maskString/maskObject, sessions, restore, modes | 4             |
| mask-logs            | core      | logging   | pinoMask, maskedDestination, winstonMask                           | 3             |
| custom-detectors     | core      | detection | PIIDetector, detectString, only/disable/regions/keyNameOnly        | 2             |
| mask-files           | core      | cli       | pii-mask CLI formats, pipes, token maps, config, runMask           | 2             |
| mask-pii-react       | framework | react     | MaskPII, usePIIMask, usePIIMaskTable                               | 1             |
| detect-names-in-text | core      | nlp       | buildCompromiseDetectors, customLexicon, regional lexicons         | 2             |

## Failure Mode Inventory

### mask-pii (4)

| #   | Mistake                                                   | Priority | Source                      | Cross-skill?     |
| --- | --------------------------------------------------------- | -------- | --------------------------- | ---------------- |
| 1   | substitute mode without a faker instance                  | CRITICAL | packages/core/src/masker.ts | —                |
| 2   | reading maskObject result as an object                    | HIGH     | packages/core/src/masker.ts | —                |
| 3   | pseudonymizing records without a shared session           | HIGH     | packages/core/src/masker.ts | —                |
| 4   | expecting bare digits or dates to be masked without a key | HIGH     | packages/core/README.md     | custom-detectors |

### mask-logs (3)

| #   | Mistake                                             | Priority | Source                                              | Cross-skill? |
| --- | --------------------------------------------------- | -------- | --------------------------------------------------- | ------------ |
| 1   | using only formatters.log with pino                 | CRITICAL | packages/core/src/skills/skills.test.ts             | —            |
| 2   | relying on pinoMask for child bindings              | HIGH     | packages/core/src/integrations/integrations.test.ts | —            |
| 3   | passing maskedDestination as the only pino argument | HIGH     | packages/core/src/integrations/destination.ts       | —            |

### custom-detectors (2)

| #   | Mistake                                      | Priority | Source                                       | Cross-skill? |
| --- | -------------------------------------------- | -------- | -------------------------------------------- | ------------ |
| 1   | returning a non-token value in tokenize mode | HIGH     | packages/core/src/skills/skills.test.ts      | —            |
| 2   | unanchored leading quantifier in pattern     | HIGH     | packages/core/src/detectors/contact/email.ts | —            |

### mask-files (2)

| #   | Mistake                           | Priority | Source                              | Cross-skill? |
| --- | --------------------------------- | -------- | ----------------------------------- | ------------ |
| 1   | committing token map files        | CRITICAL | packages/cli/src/utils/token-map.ts | —            |
| 2   | CSV on stdin without --format csv | HIGH     | packages/cli/src/skills.test.ts     | —            |

### mask-pii-react (1)

| #   | Mistake                                          | Priority | Source                         | Cross-skill? |
| --- | ------------------------------------------------ | -------- | ------------------------------ | ------------ |
| 1   | using reveal or client masking as access control | CRITICAL | packages/react/src/MaskPII.tsx | mask-pii     |

### detect-names-in-text (2)

| #   | Mistake                       | Priority | Source                          | Cross-skill? |
| --- | ----------------------------- | -------- | ------------------------------- | ------------ |
| 1   | assuming NLP finds every name | HIGH     | packages/nlp/src/skills.test.ts | —            |
| 2   | extending compromise globally | MEDIUM   | packages/nlp/src/entity.ts      | —            |

## Tensions

| Tension                                     | Skills                      | Agent implication                                                        |
| ------------------------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| Recall versus false positives on digit runs | mask-pii ↔ custom-detectors | Values passed without keys can stay unmasked; pass keys or add detectors |

## Cross-References

| From                 | To               | Reason                                                       |
| -------------------- | ---------------- | ------------------------------------------------------------ |
| mask-logs            | mask-pii         | Modes and detection rules are shared                         |
| mask-files           | custom-detectors | Unmasked CSV columns are fixed with keys or custom detectors |
| mask-pii-react       | mask-pii         | Server-side masking is the access-control answer             |
| detect-names-in-text | mask-pii         | NLP detectors are added to a core masker via `extend`        |

## Subsystems & Reference Candidates

| Skill            | Subsystems                        | Reference candidates                                           |
| ---------------- | --------------------------------- | -------------------------------------------------------------- |
| mask-logs        | pino, winston, NDJSON destination | —                                                              |
| custom-detectors | —                                 | Built-in detector table (currently in packages/core/README.md) |

## Remaining Gaps

| Skill | Question                                                                | Status |
| ----- | ----------------------------------------------------------------------- | ------ |
| all   | Discovery prompts and a fresh-consumer agent run have not been executed | open   |

## Recommended Skill File Structure

- **Core skills:** mask-pii, mask-logs, custom-detectors, mask-files, detect-names-in-text
- **Framework skills:** mask-pii-react
- **Lifecycle skills:** none yet (a migration guide for the 0.3.0 breaking changes is a candidate)
- **Composition skills:** none; the logger integrations are covered inside mask-logs
- **Reference files:** none yet

## Coverage and batch history

### Batch 1 — initial skills (2026-10-31, @pii-mask/core 0.3.0, cli 0.3.0, react 0.3.0, nlp 1.0.0)

- Assessed scope: the public API of all four published packages and the developer tasks behind them: masking data, logging, detection tuning, CLI files and pipes, React display, and free-text entities. `pii-mask-cli` is a thin alias of `@pii-mask/cli` and gets no separate skill.
- Created mask-pii, mask-logs and custom-detectors (packages/core), mask-files (packages/cli), mask-pii-react (packages/react) and detect-names-in-text (packages/nlp). Every example was run against the built packages.
- Decision: one skill per developer task, owned by the package that implements it; the react and nlp skills require mask-pii.
- Decision: the core README's "How detection decides" section stays the authoritative home for detection rules; skills summarize and point to it.
- Library fix found while authoring: adjacent custom-lexicon words ("Emeka" + "Okafor") were masked as two separate spans; @pii-mask/nlp now joins whitespace-separated spans.
- Gap resolved: the regional lexicons in `@pii-mask/core/lexicon/*` are documented as `customLexicon` input.
- Checks: `intent validate` passes for every skill directory. Deterministic task checks live in `packages/core/src/skills/skills.test.ts`, `packages/cli/src/skills.test.ts`, `packages/react/src/skills.test.tsx` and `packages/nlp/src/skills.test.ts`; each runs the recommended solution and confirms the main warned-about mistake fails the same assertion.
- Not verified: activation (discovery) prompts and a fresh-consumer agent session; remaining work recorded above.
