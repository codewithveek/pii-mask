import { describe, it, expect } from 'vitest';
import { createMasker } from '@/masker';

describe('uuid detector', () => {
  it('detects a valid UUID v4', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('550e8400-e29b-41d4-a716-446655440000');
    expect(detections).toContain('uuid');
  });

  it('does not detect an invalid UUID (wrong variant)', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('550e8400-e29b-41d4-0716-446655440000');
    expect(detections).not.toContain('uuid');
  });

  it('does not detect an invalid UUID (wrong version)', () => {
    const masker = createMasker({ mode: 'redact' });
    const { detections } = masker.maskString('550e8400-e29b-61d4-a716-446655440000');
    expect(detections).not.toContain('uuid');
  });

  it('masks correctly in default mask mode', () => {
    const masker = createMasker();
    const { result } = masker.maskString('550e8400-e29b-41d4-a716-446655440000');
    expect(result).toContain('550e8400');
    expect(result).toContain('****');
  });

  it('fully redacts in redact mode', () => {
    const masker = createMasker({ mode: 'redact' });
    const { result } = masker.maskString('550e8400-e29b-41d4-a716-446655440000');
    expect(result).toBe('[REDACTED]');
  });

  it('tokenize round-trip works', () => {
    const masker = createMasker({ mode: 'tokenize' });
    const original = '550e8400-e29b-41d4-a716-446655440000';
    const { result, tokenMap } = masker.maskString(original);
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(masker.restore(result, tokenMap)).toBe(original);
  });

  it('detects UUID in freeform text', () => {
    const masker = createMasker({ mode: 'redact' });
    const input = 'User ID: 550e8400-e29b-41d4-a716-446655440000 logged in.';
    const { result, detections } = masker.maskString(input);
    expect(detections).toContain('uuid');
    expect(result).not.toContain('550e8400-e29b-41d4-a716-446655440000');
  });

  it('pseudonymize produces consistent labels', () => {
    const masker = createMasker({ mode: 'pseudonymize' });
    const { result } = masker.maskString('550e8400-e29b-41d4-a716-446655440000');
    expect(result).toMatch(/^UUID_\d+$/);
  });
});
