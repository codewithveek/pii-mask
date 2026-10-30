// Import all detectors — triggers self-registration
import './detectors/index';

// Public API
export { createMasker } from './masker';
export type { Masker, MaskValueResult } from './masker';
export { registry } from './registry';
export { pinoMask } from './integrations/pino';
export { winstonMask } from './integrations/winston';
export { maskedDestination } from './integrations/destination';
export type { WritableLike } from './integrations/destination';
export type { WinstonInfo } from './integrations/winston';
export { generateToken, getOrCreateToken, getOrCreateLabel, serializeError } from './engine';
export {
  PIICategory,
  MaskMode,
  type PIIDetector,
  type MaskContext,
  type MaskResult,
  type MaskOptions,
  type MaskSession,
  type NLPOptions,
  type FakerLike,
} from './types';
