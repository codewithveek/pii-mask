# @pii-mask/core

## 0.2.1

### Patch Changes

- Fix inline PII detection in maskObject/maskArray. The walk() function now falls through to maskText() when atomic detection misses, enabling detection of inline PII in freeform text fields.

## 0.2.0

### Minor Changes

- Add 8 new detectors (uuid, mongodb-objectid, vin, aws-key, github-pat, platform-token, mac-address, sin-ca), new API methods (createSession, detectString, restoreObject, restoreArray), regions filtering, session support, and CLI config file support.
