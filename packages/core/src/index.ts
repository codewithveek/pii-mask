// Import all detectors — triggers self-registration
import './detectors/index.js';

// Public API
export { createMasker } from './masker.js';
export { registry } from './registry.js';
export { generateToken, getOrCreateToken, getOrCreateLabel } from './engine.js';
export {
  PIICategory,
  MaskMode,
  type PIIDetector,
  type MaskContext,
  type MaskResult,
  type MaskOptions,
  type NLPOptions,
} from './types.js';
