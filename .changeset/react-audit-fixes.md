---
'@pii-mask/react': minor
---

- The bundle is marked `'use client'` for React Server Components
- The React version check warns once instead of throwing on import
- `usePIIMaskTable` uses one session per table (consistent pseudonyms) and masks nested values and numeric sensitive fields
- The unused `fallback` prop is deprecated
