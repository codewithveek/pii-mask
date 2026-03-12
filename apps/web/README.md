# apps/web

Browser-only PII masking tool — `app.pii-mask.dev`.

## Running locally

```bash
pnpm turbo dev --filter=web
```

## Environment variables

None required — all execution is client-side.

## Dependencies

- `@pii-mask/core` — masking engine
- `@pii-mask/react` — React bindings

## Deployment

Vercel static SPA. Build output: `dist/`.
