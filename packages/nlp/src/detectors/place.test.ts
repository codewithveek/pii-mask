import { describe, it, expect } from 'vitest';
import { buildPlaceDetector } from './place.js';
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

describe('buildPlaceDetector', () => {
  const detector = buildPlaceDetector();

  it('has correct metadata', () => {
    expect(detector.id).toBe('nlp-place');
    expect(detector.category).toBe('identity');
  });

  it('detects a well-known city', () => {
    expect(detector.detect('New York')).toBe(true);
  });

  it('detects a country name', () => {
    expect(detector.detect('United States')).toBe(true);
  });

  it('does not detect non-place text', () => {
    expect(detector.detect('running shoes')).toBe(false);
  });

  it('does not detect numbers', () => {
    expect(detector.detect('42')).toBe(false);
  });

  it('redacts to [REDACTED]', () => {
    const ctx = makeCtx(MaskMode.REDACT);
    expect(detector.mask('New York', MaskMode.REDACT, ctx)).toBe('[REDACTED]');
  });

  it('tokenizes to PII token', () => {
    const ctx = makeCtx(MaskMode.TOKENIZE);
    const token = detector.mask('New York', MaskMode.TOKENIZE, ctx);
    expect(token).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
  });

  it('pseudonymizes to PLACE_N label', () => {
    const ctx = makeCtx(MaskMode.PSEUDONYMIZE);
    const label = detector.mask('New York', MaskMode.PSEUDONYMIZE, ctx);
    expect(label).toMatch(/^PLACE_\d+$/);
  });

  it('anonymizes to PLACE_N label', () => {
    const ctx = makeCtx(MaskMode.ANONYMIZE);
    const label = detector.mask('New York', MaskMode.ANONYMIZE, ctx);
    expect(label).toMatch(/^PLACE_\d+$/);
  });

  it('substitute without faker uses fallback', () => {
    const ctx = makeCtx(MaskMode.SUBSTITUTE);
    const result = detector.mask('New York', MaskMode.SUBSTITUTE, ctx);
    expect(result).toBe('[PLACE]');
  });

  it('masks in default mode', () => {
    const ctx = makeCtx(MaskMode.MASK);
    const masked = detector.mask('New York', MaskMode.MASK, ctx);
    expect(masked).not.toBe('New York');
  });

  it('tokenize round-trip preserves consistency', () => {
    const ctx = makeCtx(MaskMode.TOKENIZE);
    const t1 = detector.mask('New York', MaskMode.TOKENIZE, ctx);
    const t2 = detector.mask('New York', MaskMode.TOKENIZE, ctx);
    expect(t1).toBe(t2);
  });
});
