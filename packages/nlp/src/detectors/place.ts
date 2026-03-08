import nlp from 'compromise';
import { getOrCreateToken, getOrCreateLabel } from '@pii-mask/core';
import type { PIIDetector, MaskContext } from '@pii-mask/core';
import { PIICategory, MaskMode } from '@pii-mask/core';

export function buildPlaceDetector(): PIIDetector {
  return {
    id: 'nlp-place',
    label: 'Place / Location (NLP)',
    category: PIICategory.IDENTITY,

    detect(value) {
      const places = nlp(value).places().out('array') as string[];
      return places.length > 0;
    },

    mask(value, mode, ctx) {
      if (mode === MaskMode.REDACT) return '[REDACTED]';
      if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
      if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
        return getOrCreateLabel('PLACE', value, ctx, PIICategory.IDENTITY);
      }
      if (mode === MaskMode.SUBSTITUTE) {
        return ctx.faker?.location.city() ?? '[PLACE]';
      }
      return value.replace(
        /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g,
        (match) => match[0] + '*'.repeat(match.length - 1),
      );
    },
  };
}
