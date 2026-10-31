---
name: mask-pii-react
description: >
  Use when displaying masked PII in a React or Next.js UI with
  @pii-mask/react: the MaskPII component, usePIIMask and usePIIMaskTable
  hooks, and reveal toggles. Covers why client-side masking is not access
  control.
metadata:
  purpose: >
    Shows how to render masked values and tables with @pii-mask/react and
    where client-side masking stops being a privacy control.
  type: framework
  framework: react
  library: '@pii-mask/react'
  library_version: '0.3.0'
sources:
  - src/MaskPII.tsx
  - src/hooks/usePIIMask.ts
  - src/hooks/usePIIMaskTable.ts
  - README.md
  - src/skills.test.tsx
requires:
  - '@pii-mask/core#mask-pii'
---

# Display masked PII in React

Depends on `@pii-mask/core#mask-pii` for modes and detection rules; read it first (`npx @tanstack/intent load @pii-mask/core#mask-pii`).

## Setup

```tsx
import { MaskPII } from '@pii-mask/react';

export function Email({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  return (
    <MaskPII mode="mask" reveal={isAdmin}>
      {email}
    </MaskPII>
  );
}
// <span data-pii-masked="true">j***@example.com</span>
```

Install `@pii-mask/react @pii-mask/core` (React >= 18). The bundle is marked `'use client'`, so it can be imported from Next.js server components; masking runs on the client.

## Core Patterns

### Mask a value in your own markup

```tsx
import { usePIIMask } from '@pii-mask/react';

export function Note({ text }: { text: string }) {
  const { masked, detections } = usePIIMask(text, { mode: 'redact' });
  return <p title={detections.join(', ')}>{masked}</p>;
}
```

### Mask a table

```tsx
import { usePIIMaskTable } from '@pii-mask/react';

type Row = { name: string; email: string; plan: string };

export function Customers({ rows, isAdmin }: { rows: Row[]; isAdmin: boolean }) {
  const { maskedData } = usePIIMaskTable(rows, { mode: 'pseudonymize', reveal: isAdmin, maskColumns: ['email'] });
  return (
    <ul>
      {maskedData.map((r, i) => (
        <li key={i}>
          {r.name}: {r.email}
        </li>
      ))}
    </ul>
  );
}
```

One session covers the whole table, so a repeated email gets the same `EMAIL_n` in every row. Nested objects and numeric sensitive fields are masked; `maskColumns` limits which columns run. Pass a stable `rows` array (memoize it) — masking re-runs when its identity changes.

## Common Mistakes

**CRITICAL — Using `reveal` or client-side masking as access control.** The raw value is already in the browser (props, devtools, network response) before React masks it. When a viewer must never see a value, mask it on the server with @pii-mask/core and send only the masked result. Source: `src/MaskPII.tsx`.

**MEDIUM — Passing `fallback` to `MaskPII`.** It is deprecated and has no effect; masking is synchronous. Source: `src/MaskPII.tsx`.

**MEDIUM — Creating `options.detect`/`disable` arrays inline and expecting no re-mask.** The hooks key on the arrays' contents, so inline arrays are fine; recreating `rows` on every render is what re-runs table masking. Source: `src/hooks/usePIIMaskTable.ts`.

## Completion

Render the component in a test (`@testing-library/react`) and assert the output text does not contain the original value and `data-pii-masked="true"`; with `reveal` the original appears. For data the viewer must not see, assert the server response itself is already masked.
