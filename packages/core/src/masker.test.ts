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
    const { result } = masker.maskArray([
      { email: 'a@b.com' },
      { email: 'c@d.com' },
    ]);
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
});
