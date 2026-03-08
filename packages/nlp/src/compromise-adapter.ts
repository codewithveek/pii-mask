import nlp from 'compromise';
import { getOrCreateToken, getOrCreateLabel } from '@pii-mask/core';
import type { PIIDetector, MaskContext, NLPOptions } from '@pii-mask/core';
import { PIICategory, MaskMode } from '@pii-mask/core';

export function buildCompromiseDetectors(options: NLPOptions = {}): PIIDetector[] {
  const {
    confidence = 0.7,
    entities = ['Person', 'Place'],
    customLexicon = {},
  } = options;

  // Prefer the object-style extend when only adding words
  if (Object.keys(customLexicon).length > 0) {
    nlp.extend({ words: customLexicon });
  }

  const detectors: PIIDetector[] = [];

  if (entities.includes('Person')) {
    detectors.push({
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
        // Default mask: replace each detected name inline
        let masked = value;
        const people = nlp(value).people().out('array') as string[];
        for (const name of people) {
          masked = masked.replace(name, name.slice(0, 1) + '*'.repeat(name.length - 1));
        }
        return masked;
      },
    });
  }

  if (entities.includes('Place')) {
    detectors.push({
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
    });
  }

  return detectors;
}
