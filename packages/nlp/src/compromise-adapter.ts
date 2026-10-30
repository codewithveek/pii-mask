import type { PIIDetector, NLPOptions } from '@pii-mask/core';
import { buildEntityDetector } from './entity';

export function buildCompromiseDetectors(options: NLPOptions = {}): PIIDetector[] {
  const { confidence = 0.7, entities = ['Person', 'Place'], customLexicon } = options;
  const lexicon =
    customLexicon && Object.keys(customLexicon).length > 0 ? customLexicon : undefined;
  return entities.map((kind) => buildEntityDetector(kind, { confidence, lexicon }));
}
