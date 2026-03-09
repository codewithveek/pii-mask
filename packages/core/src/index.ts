// Import all detectors — triggers self-registration
import './detectors/index';

// Public API
export { createMasker } from './masker';
export { registry } from './registry';
export { generateToken, getOrCreateToken, getOrCreateLabel } from './engine';
export {
  PIICategory,
  MaskMode,
  type PIIDetector,
  type MaskContext,
  type MaskResult,
  type MaskOptions,
  type NLPOptions,
} from './types';
