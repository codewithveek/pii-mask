import type { Masker } from '../masker';
import type { MaskOptions } from '../types';
import { toMasker } from './pino';

/** Shape of a winston log entry: `level`, `message`, metadata and Symbol keys. */
export type WinstonInfo = Record<string | symbol, unknown> & { level: string; message: unknown };

/**
 * A winston format that masks the message and all metadata. It mutates the
 * entry in place so winston's internal Symbol keys survive.
 *
 * ```ts
 * winston.createLogger({
 *   format: winston.format.combine(winstonMask({ mode: 'redact' }), winston.format.json()),
 * });
 * ```
 *
 * `logger.error(err)` entries keep their (masked) `message` and `stack`.
 */
export function winstonMask(options: MaskOptions | Masker = {}) {
  const masker = toMasker(options);

  return {
    transform(info: WinstonInfo): WinstonInfo {
      const source: Record<string, unknown> = { ...(info as Record<string, unknown>) };
      // Error fields are non-enumerable; lift them so they're masked and kept.
      if (info instanceof Error) {
        source['message'] = info.message;
        source['stack'] = info.stack;
      }
      const masked = masker.mask(source).result;
      delete masked['type']; // added by Error serialization; not a winston field
      for (const [k, v] of Object.entries(masked)) {
        if (k === 'level') continue;
        Object.defineProperty(info, k, {
          value: v,
          enumerable: true,
          writable: true,
          configurable: true,
        });
      }
      return info;
    },
  };
}
