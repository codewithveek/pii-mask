// ── Categories ──────────────────────────────────────────────────────────────
export const PIICategory = {
  GOV_ID: 'gov-id',
  FINANCIAL: 'financial',
  CONTACT: 'contact',
  SECRET: 'secret',
  BIOMETRIC: 'biometric',
  NETWORK: 'network',
  IDENTITY: 'identity',
} as const;

export type PIICategory = (typeof PIICategory)[keyof typeof PIICategory];

// ── Modes ───────────────────────────────────────────────────────────────────
export const MaskMode = {
  MASK: 'mask',
  REDACT: 'redact',
  PSEUDONYMIZE: 'pseudonymize',
  ANONYMIZE: 'anonymize',
  TOKENIZE: 'tokenize',
  SUBSTITUTE: 'substitute',
} as const;

export type MaskMode = (typeof MaskMode)[keyof typeof MaskMode];

// ── Detector contract ───────────────────────────────────────────────────────
export interface PIIDetector {
  /** Unique stable identifier — used to disable/filter detectors */
  id: string;
  /** Human-readable label for reports */
  label: string;
  category: PIICategory;
  /** ISO 3166-1 alpha-2 codes. Omit for universal detectors. */
  regions?: string[];
  /**
   * Returns true if this detector claims the value.
   * @param value  The string to evaluate
   * @param key    The object key / CSV column header (if available)
   */
  detect: (value: string, key?: string) => boolean;
  /**
   * Transforms value according to mode.
   * Substitute mode receives a faker instance for type-appropriate generation.
   */
  mask: (value: string, mode: MaskMode, ctx: MaskContext) => string;
  /**
   * Optional. A global regex that locates all occurrences of this PII type
   * within freeform text. When present, maskText() uses it to find and replace
   * inline. When absent, the detector only works on atomic field values.
   * Must have the `g` flag.
   */
  pattern?: RegExp;
  /**
   * When true, the pattern provides sufficient contextual validation (e.g. via
   * lookbehinds) so maskText() skips the detect() secondary gate.
   * Use for detectors whose detect() requires a key hint that is unavailable
   * in freeform text but whose pattern already encodes that context.
   */
  contextualPattern?: boolean;
}

// ── Masking context passed to every mask() call ─────────────────────────────
export interface MaskContext {
  mode: MaskMode;
  /** Monotonically increasing counter per category, used for pseudonymize labels */
  counter: Map<PIICategory, number>;
  /** value → token, used for tokenize + pseudonymize consistency */
  tokenMap: Map<string, string>;
  /** Detector IDs that fired during this masking session, accumulated by maskValue() */
  detections: string[];
  /** faker instance, present only when mode === 'substitute' */
  faker?: import('@faker-js/faker').Faker;
}

// ── Result types ────────────────────────────────────────────────────────────
export interface MaskResult {
  result: string;
  /** Populated in tokenize mode; maps token → original value */
  tokenMap: Record<string, string>;
  /** All detector IDs that fired during this operation */
  detections: string[];
}

export interface MaskOptions {
  mode?: MaskMode;
  /** Detector IDs to disable */
  disable?: string[];
  /** If set, run ONLY these category names or detector IDs */
  only?: string[];
  /** Additional custom detectors to register */
  extend?: PIIDetector[];
  /** Skip value-level regex detection; rely on key-name heuristics only */
  keyNameOnly?: boolean;
  nlpOptions?: NLPOptions;
}

export interface NLPOptions {
  confidence?: number;
  entities?: Array<'Person' | 'Place' | 'Organization'>;
  customLexicon?: Record<string, 'Person' | 'Place' | 'Organization'>;
}
