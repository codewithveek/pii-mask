# @pii-mask/react

React bindings for the `@pii-mask` toolkit. Provides a component and hooks for masking PII in React applications — SSR-safe, memoized, and compatible with any table library.

## Installation

```bash
pnpm add @pii-mask/react @pii-mask/core
```

For **substitute** mode, also install:

```bash
pnpm add @faker-js/faker
```

**Peer dependency:** React >= 18.0.0

## Security: React CVE Guard

This package includes a runtime guard that blocks known-vulnerable React versions at import time. If your React version has a critical CVE, the import will throw an error with upgrade instructions.

Currently blocked versions:
- React 19.0.0–19.0.3 (CVE-2025-55182)
- React 19.1.0–19.1.4 (CVE-2025-55184)
- React 19.2.0–19.2.3 (CVE-2026-23864)

This guard is intentional and cannot be bypassed. Upgrade React to resolve.

## API Reference

### `<MaskPII>`

A component that masks PII in its children string.

```tsx
import { MaskPII } from '@pii-mask/react';

function UserProfile({ email, isAdmin }) {
  return (
    <div>
      <MaskPII mode="mask" reveal={isAdmin}>
        {email}
      </MaskPII>
    </div>
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `string` | *(required)* | The text to mask |
| `mode` | `MaskMode` | `'mask'` | Masking mode |
| `detect` | `string[]` | — | Detector IDs or categories to run. Default: all. |
| `reveal` | `boolean` | `false` | When `true`, renders the original unmasked value |
| `fallback` | `ReactNode` | — | Rendered while masking |
| `className` | `string` | — | CSS class for the wrapper `<span>` |
| `style` | `CSSProperties` | — | Inline styles for the wrapper `<span>` |

#### Output HTML

```html
<!-- Masked (default) -->
<span data-pii-masked="true">jo***n@example.com</span>

<!-- Revealed -->
<span data-pii-masked="false">john@example.com</span>
```

The `data-pii-masked` attribute lets you style masked vs. revealed states in CSS:

```css
[data-pii-masked="true"] {
  font-family: monospace;
  color: #999;
}
```

#### `reveal` prop

The `reveal` prop renders the raw value. It is the **caller's responsibility** to gate this on authorization — the component does not enforce access control.

```tsx
// Admin sees real data, others see masked
<MaskPII reveal={user.role === 'admin'}>{user.ssn}</MaskPII>
```

### `usePIIMask(value, options?)`

A hook for masking a single string value. Returns the masked result, detections, token map, and a restore function.

```tsx
import { usePIIMask } from '@pii-mask/react';

function MaskedEmail({ email }) {
  const { masked, detections, restore } = usePIIMask(email, {
    mode: 'tokenize',
  });

  return (
    <div>
      <p>Masked: {masked}</p>
      <p>Detections: {detections.join(', ')}</p>
      <button onClick={() => alert(restore(masked))}>Reveal</button>
    </div>
  );
}
```

#### Options

```ts
interface UsePIIMaskOptions {
  mode?: MaskMode;      // default: 'mask'
  detect?: string[];    // only run these detector IDs/categories
  disable?: string[];   // skip these detector IDs
}
```

#### Return Value

```ts
interface UsePIIMaskReturn {
  masked: string;                        // the masked output
  tokenMap: Record<string, string>;      // token → original (tokenize mode)
  detections: string[];                  // detector IDs that fired
  restore: (masked: string) => string;   // reverse tokenization
}
```

#### Memoization

The masker instance is memoized on `[mode, detect, disable]`. The result is memoized on `[masker, value]`. The hook does not recreate the masker on every render.

### `usePIIMaskTable(data, options?)`

A headless hook for masking tabular data. Works with any table library — TanStack Table, MUI DataGrid, AG Grid, or plain HTML tables. Returns `{ maskedData }` with no markup.

```tsx
import { usePIIMaskTable } from '@pii-mask/react';

function UsersTable({ users, isAdmin }) {
  const { maskedData } = usePIIMaskTable(users, {
    mode: 'redact',
    reveal: isAdmin,
    maskColumns: ['email', 'ssn'],
  });

  return (
    <table>
      <thead>
        <tr><th>Name</th><th>Email</th><th>SSN</th></tr>
      </thead>
      <tbody>
        {maskedData.map((row) => (
          <tr key={row.id}>
            <td>{row.name}</td>
            <td>{row.email}</td>
            <td>{row.ssn}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

#### Options

```ts
interface UsePIIMaskTableOptions<T> {
  maskColumns?: (keyof T)[];   // columns to mask. Default: all string columns.
  mode?: MaskMode;             // default: 'mask'
  reveal?: boolean;            // when true, returns original data untouched
  disable?: string[];          // detector IDs to skip
}
```

#### Return Value

```ts
interface UsePIIMaskTableReturn<T> {
  maskedData: T[];   // same shape as input, with masked string values
}
```

#### With TanStack Table

```tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { usePIIMaskTable } from '@pii-mask/react';

function DataTable({ data, columns, isAdmin }) {
  const { maskedData } = usePIIMaskTable(data, {
    mode: 'mask',
    reveal: isAdmin,
  });

  const table = useReactTable({
    data: maskedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // ... render table
}
```

#### Column Filtering

When `maskColumns` is provided, only those columns are processed. Other columns pass through untouched:

```ts
const { maskedData } = usePIIMaskTable(users, {
  maskColumns: ['email', 'ssn'],  // only mask these
  mode: 'redact',
});
// maskedData[0].name  → 'John Doe' (untouched)
// maskedData[0].email → '[REDACTED]'
```

When `maskColumns` is omitted, all string columns run through detectors.

## SSR Safety

All components and hooks are SSR-safe — they use no `window`, `document`, or `localStorage` references. Masking runs synchronously via `useMemo`, so there are no hydration mismatches.

## Types

```ts
import type {
  MaskPIIProps,
  UsePIIMaskOptions,
  UsePIIMaskReturn,
  UsePIIMaskTableOptions,
  UsePIIMaskTableReturn,
} from '@pii-mask/react';
```

## License

MIT
