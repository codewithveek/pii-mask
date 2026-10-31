---
name: mask-logs
description: >
  Use when keeping PII and secrets out of application logs with pino or winston
  via @pii-mask/core: masking log messages, metadata, request headers,
  child-logger bindings and logged Errors. For masking data outside a logger,
  use mask-pii.
metadata:
  purpose: >
    Shows how to wire @pii-mask/core's pinoMask, maskedDestination and
    winstonMask into an existing logger so messages, metadata and errors are
    masked before they are written.
  type: core
  library: '@pii-mask/core'
  library_version: '0.3.0'
sources:
  - src/integrations/pino.ts
  - src/integrations/winston.ts
  - src/integrations/destination.ts
  - src/integrations/integrations.test.ts
  - src/skills/skills.test.ts
requires:
  - mask-pii
---

# Mask PII in pino and winston logs

Read mask-pii first for modes and what counts as PII. These integrations have no dependency on pino or winston; they use whatever version the app already has.

## Setup

### pino

```ts
import pino from 'pino';
import { pinoMask } from '@pii-mask/core';

const logger = pino({ ...pinoMask({ mode: 'redact' }) });

logger.info({ user: { email: 'jane@acme.com' } }, 'login from %s', '10.1.2.3');
// {"level":30,...,"user":{"email":"[REDACTED]"},"msg":"login from [REDACTED]"}
```

`pinoMask()` returns `{ hooks: { logMethod }, formatters: { log } }`. `formatters.log` masks the merging object; `hooks.logMethod` masks the message, interpolation arguments and logged Errors (pino never passes `msg` to `formatters.log`). Errors keep their `type`, and their message and stack are masked.

### winston

```ts
import winston from 'winston';
import { winstonMask } from '@pii-mask/core';

const logger = winston.createLogger({
  format: winston.format.combine(winstonMask({ mode: 'redact' }), winston.format.json()),
  transports: [new winston.transports.Console()],
});

logger.error(new Error('failed for jane@acme.com'));
// {"level":"error","message":"failed for [REDACTED]","stack":"Error: failed for [REDACTED]\n..."}
```

Put `winstonMask()` **before** the final serializing format (`json()`, `printf()`), so the serializer sees masked values.

## Core Patterns

### Child loggers and anything pino serializes: `maskedDestination()`

pino does not run formatters on child bindings, so `logger.child({ email })` would bypass `pinoMask()`. Mask the final line instead:

```ts
import pino from 'pino';
import { maskedDestination } from '@pii-mask/core';

const logger = pino({}, maskedDestination(process.stdout, { mode: 'redact' }));
logger.child({ email: 'kid@acme.com' }).info('child');
// {"level":30,...,"email":"[REDACTED]","msg":"child"}
```

Pass the destination as pino's **second** argument. It works with any NDJSON writer: JSON lines are masked structurally, other lines as text. Call `.flush()` on shutdown to write a trailing partial line. Cost: one JSON parse/stringify per line.

### Reuse one masker

All three accept `MaskOptions` or an existing masker from `createMasker()`, so detector options (`disable`, `regions`, `extend`) are configured once.

## Common Mistakes

**CRITICAL — Using only `formatters.log` for pino.** The `msg` string is never passed to it, so `logger.info('signup jane@acme.com')` is written unmasked. Spread the full `pinoMask()` result (it includes `hooks.logMethod`). Source: `src/integrations/pino.ts`.

**HIGH — Expecting `pinoMask()` to mask `logger.child({ … })` bindings.** pino resets the bindings formatter for children. Use `maskedDestination()` when child bindings may contain PII. Source: `src/integrations/integrations.test.ts`.

**HIGH — Passing `maskedDestination()` as pino's only argument.** pino then treats it as options and logs unmasked to stdout. Use `pino({}, maskedDestination(...))`. Source: `src/integrations/destination.ts`.

**MEDIUM — Using `tokenize`/`pseudonymize` with a long-lived session for logs.** A shared session's token map grows with every unique value for the life of the process. The integrations mask each call independently; prefer `redact` or `mask` for logs.

## Completion

Log one line containing a known email through the configured logger into a test stream; the task is done when the written line parses, contains `[REDACTED]` (or the masked form), and does not contain the original email. Check `logger.error(new Error(...))` too: the written `err.message`/`message` must be masked and still present.
