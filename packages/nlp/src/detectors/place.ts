import type { PIIDetector } from '@pii-mask/core';
import { buildEntityDetector } from '../entity';

export function buildPlaceDetector(confidence = 0.7): PIIDetector {
  return buildEntityDetector('Place', { confidence });
}
