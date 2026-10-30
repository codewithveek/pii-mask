import type { PIIDetector } from '@pii-mask/core';
import { buildEntityDetector } from '../entity';

export function buildPersonDetector(confidence = 0.7): PIIDetector {
  return buildEntityDetector('Person', { confidence });
}
