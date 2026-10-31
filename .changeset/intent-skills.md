---
'@pii-mask/core': patch
'@pii-mask/cli': patch
'@pii-mask/react': patch
'@pii-mask/nlp': patch
'pii-mask-cli': patch
---

- Ship TanStack Intent skills for AI coding agents: `mask-pii`, `mask-logs` and `custom-detectors` (core), `mask-files` (cli), `mask-pii-react` (react) and `detect-names-in-text` (nlp). Run `npx @tanstack/intent@latest install` to enable them.
- Publish with npm provenance.
- nlp: adjacent custom-lexicon words ("Emeka Okafor") are now masked as one entity instead of two.
