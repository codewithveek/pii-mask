import { describe, it, expect } from 'vitest';
import { buildPersonDetector } from './person.js';
import { MaskMode } from '@pii-mask/core';
import type { MaskContext, PIICategory } from '@pii-mask/core';

function makeCtx(mode: MaskMode): MaskContext {
  return {
    mode,
    counter: new Map<PIICategory, number>(),
    tokenMap: new Map<string, string>(),
    detections: [],
  };
}

describe('buildPersonDetector', () => {
  const detector = buildPersonDetector();

  it('has correct metadata', () => {
    expect(detector.id).toBe('nlp-person');
    expect(detector.category).toBe('identity');
  });

  it('detects a common person name', () => {
    expect(detector.detect('John Smith')).toBe(true);
  });

  it('detects multi-word names', () => {
    expect(detector.detect('Mary Jane Watson')).toBe(true);
  });

  it('does not detect non-name text', () => {
    expect(detector.detect('the server crashed at 3am')).toBe(false);
  });

  it('does not detect numbers', () => {
    expect(detector.detect('123456')).toBe(false);
  });

  it('respects custom confidence', () => {
    const strict = buildPersonDetector(0.99);
    expect(strict.detect('hello world')).toBe(false);
  });

  it('redacts to [REDACTED]', () => {
    const ctx = makeCtx(MaskMode.REDACT);
    expect(detector.mask('John Smith', MaskMode.REDACT, ctx)).toBe('[REDACTED]');
  });

  it('tokenizes to PII token', () => {
    const ctx = makeCtx(MaskMode.TOKENIZE);
    const token = detector.mask('John Smith', MaskMode.TOKENIZE, ctx);
    expect(token).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
  });

  it('pseudonymizes to PERSON_N label', () => {
    const ctx = makeCtx(MaskMode.PSEUDONYMIZE);
    const label = detector.mask('John Smith', MaskMode.PSEUDONYMIZE, ctx);
    expect(label).toMatch(/^PERSON_\d+$/);
  });

  it('anonymizes to PERSON_N label', () => {
    const ctx = makeCtx(MaskMode.ANONYMIZE);
    const label = detector.mask('John Smith', MaskMode.ANONYMIZE, ctx);
    expect(label).toMatch(/^PERSON_\d+$/);
  });

  it('substitute without faker uses fallback', () => {
    const ctx = makeCtx(MaskMode.SUBSTITUTE);
    const result = detector.mask('John Smith', MaskMode.SUBSTITUTE, ctx);
    expect(result).toBe('[NAME]');
  });

  it('masks in default mode by partial-masking names', () => {
    const ctx = makeCtx(MaskMode.MASK);
    const masked = detector.mask('John Smith', MaskMode.MASK, ctx);
    expect(masked).not.toBe('John Smith');
  });

  it('tokenize round-trip preserves consistency', () => {
    const ctx = makeCtx(MaskMode.TOKENIZE);
    const t1 = detector.mask('John Smith', MaskMode.TOKENIZE, ctx);
    const t2 = detector.mask('John Smith', MaskMode.TOKENIZE, ctx);
    expect(t1).toBe(t2);
  });
});
