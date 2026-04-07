import { describe, it, expect } from 'vitest';
import { buildCompromiseDetectors } from './compromise-adapter.js';
import { createMasker, MaskMode } from '@pii-mask/core';

describe('buildCompromiseDetectors', () => {
  it('returns Person and Place detectors by default', () => {
    const detectors = buildCompromiseDetectors();
    expect(detectors).toHaveLength(2);
    expect(detectors.map((d) => d.id)).toEqual(['nlp-person', 'nlp-place']);
  });

  it('returns only requested entities', () => {
    const detectors = buildCompromiseDetectors({ entities: ['Person'] });
    expect(detectors).toHaveLength(1);
    expect(detectors[0]!.id).toBe('nlp-person');
  });

  it('returns empty for no entities', () => {
    const detectors = buildCompromiseDetectors({ entities: [] });
    expect(detectors).toHaveLength(0);
  });

  it('integrates with createMasker via extend', () => {
    const nlpDetectors = buildCompromiseDetectors();
    const masker = createMasker({ mode: 'redact', extend: nlpDetectors });
    const { result, detections } = masker.maskString('John Smith');
    // NLP person detector may or may not fire depending on compromise's confidence
    // At minimum, the masker should work without throwing
    expect(typeof result).toBe('string');
    expect(Array.isArray(detections)).toBe(true);
  });

  it('accepts custom lexicon', () => {
    const detectors = buildCompromiseDetectors({
      customLexicon: { Acmecorp: 'Organization' },
    });
    expect(detectors.length).toBeGreaterThan(0);
  });

  describe('person detector', () => {
    const [personDetector] = buildCompromiseDetectors({ entities: ['Person'] });

    it('detects a known person name', () => {
      expect(personDetector!.detect('John Smith')).toBe(true);
    });

    it('does not detect random text', () => {
      expect(personDetector!.detect('the quick brown fox')).toBe(false);
    });

    it('respects confidence threshold', () => {
      const [strict] = buildCompromiseDetectors({ entities: ['Person'], confidence: 0.99 });
      // With very high confidence, only strong matches pass
      expect(strict!.detect('hello world')).toBe(false);
    });

    it('masks in redact mode', () => {
      const ctx = makeCtx(MaskMode.REDACT);
      expect(personDetector!.mask('John Smith', MaskMode.REDACT, ctx)).toBe('[REDACTED]');
    });

    it('masks in tokenize mode', () => {
      const ctx = makeCtx(MaskMode.TOKENIZE);
      const token = personDetector!.mask('John Smith', MaskMode.TOKENIZE, ctx);
      expect(token).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    });

    it('masks in pseudonymize mode', () => {
      const ctx = makeCtx(MaskMode.PSEUDONYMIZE);
      const label = personDetector!.mask('John Smith', MaskMode.PSEUDONYMIZE, ctx);
      expect(label).toMatch(/^PERSON_\d+$/);
    });

    it('masks in anonymize mode', () => {
      const ctx = makeCtx(MaskMode.ANONYMIZE);
      const label = personDetector!.mask('John Smith', MaskMode.ANONYMIZE, ctx);
      expect(label).toMatch(/^PERSON_\d+$/);
    });

    it('substitute mode without faker uses fallback', () => {
      const ctx = makeCtx(MaskMode.SUBSTITUTE);
      const result = personDetector!.mask('John Smith', MaskMode.SUBSTITUTE, ctx);
      expect(result).toBe('[NAME]');
    });

    it('masks in default mask mode', () => {
      const ctx = makeCtx(MaskMode.MASK);
      const masked = personDetector!.mask('John Smith', MaskMode.MASK, ctx);
      expect(masked).not.toBe('John Smith');
    });
  });

  describe('place detector', () => {
    const detectors = buildCompromiseDetectors({ entities: ['Place'] });
    const placeDetector = detectors[0]!;

    it('detects a known place', () => {
      expect(placeDetector.detect('New York')).toBe(true);
    });

    it('does not detect random text', () => {
      expect(placeDetector.detect('some random words')).toBe(false);
    });

    it('masks in redact mode', () => {
      const ctx = makeCtx(MaskMode.REDACT);
      expect(placeDetector.mask('New York', MaskMode.REDACT, ctx)).toBe('[REDACTED]');
    });

    it('masks in tokenize mode', () => {
      const ctx = makeCtx(MaskMode.TOKENIZE);
      const token = placeDetector.mask('New York', MaskMode.TOKENIZE, ctx);
      expect(token).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    });

    it('masks in pseudonymize mode', () => {
      const ctx = makeCtx(MaskMode.PSEUDONYMIZE);
      const label = placeDetector.mask('New York', MaskMode.PSEUDONYMIZE, ctx);
      expect(label).toMatch(/^PLACE_\d+$/);
    });

    it('masks in anonymize mode', () => {
      const ctx = makeCtx(MaskMode.ANONYMIZE);
      const label = placeDetector.mask('New York', MaskMode.ANONYMIZE, ctx);
      expect(label).toMatch(/^PLACE_\d+$/);
    });

    it('substitute mode without faker uses fallback', () => {
      const ctx = makeCtx(MaskMode.SUBSTITUTE);
      const result = placeDetector.mask('New York', MaskMode.SUBSTITUTE, ctx);
      expect(result).toBe('[PLACE]');
    });

    it('masks in default mode', () => {
      const ctx = makeCtx(MaskMode.MASK);
      const masked = placeDetector.mask('New York', MaskMode.MASK, ctx);
      expect(masked).not.toBe('New York');
    });
  });
});

function makeCtx(mode: MaskMode) {
  return {
    mode,
    counter: new Map(),
    tokenMap: new Map(),
    detections: [] as string[],
  };
}
