import { describe, it, expect } from 'vitest';
import { createMasker } from './masker.js';

describe('createMasker', () => {
  it('masks email in default mode', () => {
    const masker = createMasker();
    const { result, detections } = masker.maskString('test@example.com');
    expect(result).not.toBe('test@example.com');
    expect(detections).toContain('email');
  });

  it('masks object values', () => {
    const masker = createMasker({ mode: 'redact' });
    const { result, detections } = masker.maskObject({
      email: 'test@example.com',
      name: 'John Doe',
      age: 30,
    });
    const parsed = JSON.parse(result);
    expect(parsed.email).toBe('[REDACTED]');
    expect(parsed.age).toBe(30);
    expect(detections).toContain('email');
  });

  it('masks arrays of objects', () => {
    const masker = createMasker({ mode: 'redact' });
    const { result } = masker.maskArray([{ email: 'a@b.com' }, { email: 'c@d.com' }]);
    const parsed = JSON.parse(result);
    expect(parsed[0].email).toBe('[REDACTED]');
    expect(parsed[1].email).toBe('[REDACTED]');
  });

  it('respects disable option', () => {
    const masker = createMasker({ disable: ['email'] });
    const { detections } = masker.maskString('test@example.com');
    expect(detections).not.toContain('email');
  });

  it('respects only option', () => {
    const masker = createMasker({ only: ['email'] });
    const { detections } = masker.maskString('123-45-6789');
    expect(detections).not.toContain('ssn-us');
  });

  it('tokenize round-trips email through tokenize → restore', () => {
    const masker = createMasker({ mode: 'tokenize' });
    const original = 'hello@example.com';
    const { result, tokenMap } = masker.maskString(original);
    expect(result).not.toBe(original);
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(masker.restore(result, tokenMap)).toBe(original);
  });

  it('pseudonymize produces consistent labels', () => {
    const masker = createMasker({ mode: 'pseudonymize' });
    const { result: r1 } = masker.maskString('test@example.com');
    expect(r1).toMatch(/_\d+$/);
    expect(r1).not.toBe('test@example.com');
  });

  it('anonymize produces consistent labels', () => {
    const masker = createMasker({ mode: 'anonymize' });
    const { result } = masker.maskString('test@example.com');
    expect(result).toMatch(/_\d+$/);
    expect(result).not.toBe('test@example.com');
  });

  it('substitute produces a different value', () => {
    const masker = createMasker({ mode: 'substitute' });
    const { result, detections } = masker.maskString('test@example.com');
    expect(result).not.toBe('test@example.com');
    expect(detections).toContain('email');
  });

  it('pseudonymize on object produces labeled fields', () => {
    const masker = createMasker({ mode: 'pseudonymize' });
    const { result } = masker.maskObject({ email: 'a@b.com', ssn: '123-45-6789' });
    const parsed = JSON.parse(result);
    expect(parsed.email).not.toBe('a@b.com');
    expect(parsed.ssn).not.toBe('123-45-6789');
  });

  it('substitute on object produces fake values', () => {
    const masker = createMasker({ mode: 'substitute' });
    const { result } = masker.maskObject({ email: 'real@corp.com' });
    const parsed = JSON.parse(result);
    expect(parsed.email).not.toBe('real@corp.com');
  });

  describe('createSession', () => {
    it('shares tokenMap across maskString calls', () => {
      const masker = createMasker({ mode: 'tokenize' });
      const session = masker.createSession();
      const r1 = masker.maskString('test@example.com', undefined, session);
      const r2 = masker.maskString('test@example.com', undefined, session);
      // Same token for the same value
      expect(r1.result).toBe(r2.result);
    });

    it('shares pseudonymize labels across calls', () => {
      const masker = createMasker({ mode: 'pseudonymize' });
      const session = masker.createSession();
      const r1 = masker.maskString('test@example.com', undefined, session);
      const r2 = masker.maskString('test@example.com', undefined, session);
      expect(r1.result).toBe(r2.result);
    });

    it('provides separate detections per call', () => {
      const masker = createMasker({ mode: 'tokenize' });
      const session = masker.createSession();
      const r1 = masker.maskString('test@example.com', undefined, session);
      const r2 = masker.maskString('123-45-6789', undefined, session);
      expect(r1.detections).toContain('email');
      expect(r1.detections).not.toContain('ssn-us');
      expect(r2.detections).toContain('ssn-us');
    });

    it('works with maskObject', () => {
      const masker = createMasker({ mode: 'tokenize' });
      const session = masker.createSession();
      masker.maskString('test@example.com', undefined, session);
      const { result } = masker.maskObject({ email: 'test@example.com' }, session);
      const parsed = JSON.parse(result);
      // Should use the same token as the string call
      expect(parsed.email).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    });
  });

  describe('detectString', () => {
    it('returns detections without masking', () => {
      const masker = createMasker();
      const { detections } = masker.detectString('test@example.com');
      expect(detections).toContain('email');
    });

    it('detects with key hint', () => {
      const masker = createMasker();
      const { detections } = masker.detectString('John Doe', 'name');
      expect(detections).toContain('person-name');
    });

    it('returns empty array for non-PII', () => {
      const masker = createMasker();
      const { detections } = masker.detectString('hello world');
      expect(detections).toHaveLength(0);
    });
  });

  describe('restoreObject', () => {
    it('restores a tokenized object', () => {
      const masker = createMasker({ mode: 'tokenize' });
      const input = { email: 'test@example.com', age: 30 };
      const { result, tokenMap } = masker.maskObject(input);
      const restored = masker.restoreObject(result, tokenMap);
      expect(restored.email).toBe('test@example.com');
      expect(restored.age).toBe(30);
    });
  });

  describe('restoreArray', () => {
    it('restores a tokenized array', () => {
      const masker = createMasker({ mode: 'tokenize' });
      const input = [{ email: 'a@b.com' }, { email: 'c@d.com' }];
      const { result, tokenMap } = masker.maskArray(input);
      const restored = masker.restoreArray(result, tokenMap);
      expect(restored).toHaveLength(2);
      expect((restored[0] as Record<string, unknown>).email).toBe('a@b.com');
      expect((restored[1] as Record<string, unknown>).email).toBe('c@d.com');
    });
  });

  describe('regions filtering', () => {
    it('filters detectors by region', () => {
      const masker = createMasker({ mode: 'redact', regions: ['US'] });
      const { detections } = masker.maskString('123-45-6789');
      expect(detections).toContain('ssn-us');
    });

    it('excludes region-specific detectors not in filter', () => {
      const masker = createMasker({ mode: 'redact', regions: ['GB'] });
      const { detections } = masker.maskString('123-45-6789');
      expect(detections).not.toContain('ssn-us');
    });

    it('always includes universal detectors', () => {
      const masker = createMasker({ mode: 'redact', regions: ['US'] });
      const { detections } = masker.maskString('test@example.com');
      expect(detections).toContain('email');
    });
  });
});
