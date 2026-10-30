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
  /**
   * Optional. Locates occurrences in freeform text for detectors that cannot be
   * expressed as a single regex (e.g. NLP). Returns [start, end) offsets into
   * `text`. Matches are masked exactly like `pattern` matches.
   */
  find?: (text: string) => Array<{ start: number; end: number }>;
  /**
   * Optional. A cheap test run once per string before `pattern`/`find`; when
   * it fails the detector is skipped for that text. Use it for patterns that
   * are expensive to scan (lookbehinds) but need an obvious marker such as
   * '@' or a context word.
   */
  prefilter?: RegExp;
  /**
   * Optional. Key names that strongly imply this PII type (e.g. /^ssn$/ for
   * SSNs). When a field's key matches and no detector claimed the value by
   * format, the value is masked by this detector anyway. This catches
   * unformatted values (`{ ssn: '123456789' }`) and numeric values
   * (`{ phone: 4155552671 }`). Only values containing a digit are forced.
   */
  keyPattern?: RegExp | ((key: string) => boolean);
}

// ── Masking context passed to every mask() call ─────────────────────────────
export interface MaskContext {
  mode: MaskMode;
  /**
   * Monotonically increasing counter per label prefix (e.g. `EMAIL`, `SSN`),
   * used for pseudonymize labels.
   */
  counter: Map<string, number>;
  /** value → token, used for tokenize + pseudonymize consistency */
  tokenMap: Map<string, string>;
  /** Detector IDs that fired during this masking session, accumulated by maskValue() */
  detections: string[];
  /** faker instance, present only when mode === 'substitute' */
  faker?: FakerLike;
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
  /** ISO 3166-1 alpha-2 region codes. Filters to detectors matching these regions (universal detectors always included). */
  regions?: string[];
  /** Additional custom detectors to register */
  extend?: PIIDetector[];
  /** Skip value-level regex detection; rely on key-name heuristics only */
  keyNameOnly?: boolean;
  /**
   * A `@faker-js/faker` instance. Required for `mode: 'substitute'`:
   * `import { faker } from '@faker-js/faker'; createMasker({ mode: 'substitute', faker })`.
   * faker is an optional peer dependency and is never imported by core itself.
   */
  faker?: FakerLike;
  /**
   * Objects nested deeper than this are replaced with `'[Truncated]'` instead of
   * being walked, so hostile input cannot overflow the stack. Default: 100.
   */
  maxDepth?: number;
  /**
   * @deprecated Has no effect. Pass NLP detectors explicitly instead:
   * `createMasker({ extend: buildCompromiseDetectors(nlpOptions) })`.
   */
  nlpOptions?: NLPOptions;
}

/**
 * A `@faker-js/faker` `Faker` instance. Typed loosely so core's published
 * declarations don't require faker to be installed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FakerLike = any;

/** Opaque session handle for cross-call consistency (tokenize/pseudonymize). */
export interface MaskSession {
  /** @internal */
  readonly _ctx: MaskContext;
}

export interface NLPOptions {
  confidence?: number;
  entities?: Array<'Person' | 'Place' | 'Organization'>;
  customLexicon?: Record<string, 'Person' | 'Place' | 'Organization'>;
}
