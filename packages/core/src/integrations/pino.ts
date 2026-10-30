import { createMasker } from '../masker';
import type { Masker } from '../masker';
import type { MaskOptions } from '../types';

export function toMasker(options: MaskOptions | Masker): Masker {
  return 'maskString' in options ? (options as Masker) : createMasker(options as MaskOptions);
}

/**
 * Masks an Error but keeps it an Error (same prototype), so pino's `err`
 * serializer still reports the right `type` and uses the masked message.
 */
function maskError(masker: Masker, err: Error): Error {
  const fields = masker.mask(err).result as unknown as Record<string, unknown>;
  const copy = Object.create(Object.getPrototypeOf(err) as object) as Error;
  for (const [k, v] of Object.entries(fields)) {
    if (k === 'type') continue;
    // message/stack stay non-enumerable, like on a real Error
    const enumerable = k !== 'message' && k !== 'stack';
    Object.defineProperty(copy, k, { value: v, enumerable, writable: true, configurable: true });
  }
  return copy;
}

function maskTopLevel(masker: Masker, object: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(object)) {
    if (v instanceof Error) out[k] = maskError(masker, v);
    else rest[k] = v;
  }
  return { ...(masker.mask(rest).result as Record<string, unknown>), ...out };
}

/**
 * pino options that mask every log call in-process: the merging object (via
 * `formatters.log`) and the message, interpolation arguments and logged
 * Errors (via `hooks.logMethod` — pino never passes `msg` to `formatters.log`).
 *
 * ```ts
 * const logger = pino({ ...pinoMask({ mode: 'redact' }) });
 * ```
 *
 * pino does not run formatters on child-logger bindings
 * (`logger.child({ email })`). Mask those yourself, or write through
 * `maskedDestination()`, which masks the final serialized line.
 *
 * If you already set `hooks` or `formatters`, compose them with these.
 */
export function pinoMask(options: MaskOptions | Masker = {}) {
  const masker = toMasker(options);

  return {
    hooks: {
      logMethod(this: unknown, args: unknown[], method: (...args: unknown[]) => void): void {
        const masked = args.map((arg) => {
          if (typeof arg === 'string') return masker.maskString(arg).result;
          if (arg instanceof Error) return maskError(masker, arg);
          return arg;
        });
        method.apply(this, masked);
      },
    },
    formatters: {
      log: (object: Record<string, unknown>) => maskTopLevel(masker, object),
    },
  };
}
