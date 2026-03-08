import nlp from 'compromise';
import { getOrCreateToken, getOrCreateLabel } from '@pii-mask/core';
import type { PIIDetector, MaskContext } from '@pii-mask/core';
import { PIICategory, MaskMode } from '@pii-mask/core';

export function buildPersonDetector(confidence = 0.7): PIIDetector {
  return {
    id: 'nlp-person',
    label: 'Person Name (NLP)',
    category: PIICategory.IDENTITY,

    detect(value) {
      const people = nlp(value).people().out('array') as string[];
      const ratio = people.join(' ').length / value.length;
      return people.length > 0 && ratio >= confidence;
    },

    mask(value, mode, ctx) {
      if (mode === MaskMode.REDACT) return '[REDACTED]';
      if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
      if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
        return getOrCreateLabel('PERSON', value, ctx, PIICategory.IDENTITY);
      }
      if (mode === MaskMode.SUBSTITUTE) {
        return ctx.faker?.person.fullName() ?? '[NAME]';
      }
      let masked = value;
      const people = nlp(value).people().out('array') as string[];
      for (const name of people) {
        masked = masked.replace(name, name.slice(0, 1) + '*'.repeat(name.length - 1));
      }
      return masked;
    },
  };
}
