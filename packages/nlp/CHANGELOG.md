# @pii-mask/nlp

## 1.0.0

### Minor Changes

- 5f71c18: - Detects names, places and organizations inside freeform text (previously whole values only), masking just the entity
  - A sentence that mentions a place is no longer replaced wholesale; mask mode masks only entity words
  - Custom lexicons are kept per detector set instead of mutating compromise's global state
  - New `Organization` entity support and `buildEntityDetector()`; parses are cached

### Patch Changes

- Updated dependencies [5f71c18]
  - @pii-mask/core@0.3.0

## 0.2.1

### Patch Changes

- Updated dependencies
  - @pii-mask/core@0.2.1

## 0.2.0

### Minor Changes

- Add 8 new detectors (uuid, mongodb-objectid, vin, aws-key, github-pat, platform-token, mac-address, sin-ca), new API methods (createSession, detectString, restoreObject, restoreArray), regions filtering, session support, and CLI config file support.

### Patch Changes

- Updated dependencies
  - @pii-mask/core@0.2.0
