# @pii-mask/core

## 0.3.1

### Patch Changes

- 6278bdf: - Ship TanStack Intent skills for AI coding agents: `mask-pii`, `mask-logs` and `custom-detectors` (core), `mask-files` (cli), `mask-pii-react` (react) and `detect-names-in-text` (nlp). Run `npx @tanstack/intent@latest install` to enable them.
  - Publish with npm provenance.
  - nlp: adjacent custom-lexicon words ("Emeka Okafor") are now masked as one entity instead of two.

## 0.3.0

### Minor Changes

- 5f71c18: Audit fixes for correctness, accuracy, security and performance.

  **Breaking**

  - `mode: 'substitute'` now needs a faker instance: `createMasker({ mode: 'substitute', faker })`. Core no longer imports `@faker-js/faker`, so the package loads without the optional peer installed (it previously failed to import).
  - Tokens are 64-bit (`<<PII_` + 16 hex + `>>`) instead of 32-bit.
  - Pseudonym labels are numbered per type (`EMAIL_1`, `PHONE_1`) instead of per category (`EMAIL_1`, `PHONE_2`).
  - Stricter detection to cut false positives: bare digit runs are no longer phones; cards need a real issuer range; NIN/BVN need a key or context; a bare 12-digit Aadhaar needs an `aadhaar` key; dates are only dates of birth under a birth key or after a birth context word; key-name matching is exact (no more `capacity` → city, `secretary` → secret, `product.name` → person).
  - `createMasker` throws on unknown modes.
  - `MaskContext.counter` is keyed by label prefix.

  **Fixes**

  - An object referenced twice is masked at every occurrence (the second copy used to leak unmasked); cycles become `'[Circular]'` instead of throwing.
  - Dates, Errors (message and stack), Maps, Sets, BigInts and `toJSON()` objects are serialized instead of becoming `{}` or throwing; numbers under sensitive keys are masked; credential containers are redacted whole; `__proto__` keys are preserved; new `maxDepth` option.
  - `keyNameOnly` no longer falls back to value patterns.
  - `restoreObject`/`restoreArray` work when originals contain quotes or backslashes; `restore` matches whole tokens (`EMAIL_1` no longer matches inside `EMAIL_10`); tokens are collision-checked.
  - Freeform text is scanned in one pass with overlap resolution: no partial masking inside longer numbers, no re-scanning of masked output, compressed IPv6 fully masked.
  - 16-digit cards are no longer labelled Indonesian NIKs; BVN is reachable; `regions: ['GB']` (and `'UK'`) selects the UK NI detector.
  - New coverage: `authorization`, `cookie`, `x-api-key`, `passwd`, `pwd` and other credential keys; spaced IBANs and Aadhaar numbers in text; DD/MM/YYYY dates; key-forced masking of unformatted SSNs, phones and VINs.
  - Shorter visible part for short email local parts (`jane@` → `j***@`).
  - Uses Web Crypto instead of `node:crypto`, so no bundler shim is needed in browsers.
  - Linear-time email and JWT patterns (previously quadratic on long inputs); detector prefilters, pooled randomness and lazy token maps make masking ~2.5x faster.

  **New**

  - `mask()` returns a masked copy with the original structure; `restoreValue()` restores it; `getTokenMap(session)`.
  - `pinoMask()`, `maskedDestination()` and `winstonMask()` logger integrations.
  - Detector fields `keyPattern`, `find` and `prefilter`.
  - Requires `@faker-js/faker` >= 10.5.0 (GHSA-qxc2-j82w-r537) when used.

## 0.2.1

### Patch Changes

- Fix inline PII detection in maskObject/maskArray. The walk() function now falls through to maskText() when atomic detection misses, enabling detection of inline PII in freeform text fields.

## 0.2.0

### Minor Changes

- Add 8 new detectors (uuid, mongodb-objectid, vin, aws-key, github-pat, platform-token, mac-address, sin-ca), new API methods (createSession, detectString, restoreObject, restoreArray), regions filtering, session support, and CLI config file support.
