# @pii-mask/react

## 0.3.0

### Minor Changes

- 5f71c18: - The bundle is marked `'use client'` for React Server Components
  - The React version check warns once instead of throwing on import
  - `usePIIMaskTable` uses one session per table (consistent pseudonyms) and masks nested values and numeric sensitive fields
  - The unused `fallback` prop is deprecated

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
