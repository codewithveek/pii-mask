import { describe, it, expect } from 'vitest';
import { generateToken, getOrCreateToken, getOrCreateLabel, createContext, extractTokenMap, walk } from './engine.js';
import { MaskMode, PIICategory } from './types.js';
import type { PIIDetector } from './types.js';

describe('generateToken', () => {
  it('generates a token with correct format', () => {
    const token = generateToken();
    expect(token).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
  });

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken()));
    expect(tokens.size).toBe(100);
  });
});

describe('getOrCreateToken', () => {
  it('returns the same token for the same value', () => {
    const ctx = createContext(MaskMode.TOKENIZE);
    const t1 = getOrCreateToken('hello', ctx);
    const t2 = getOrCreateToken('hello', ctx);
    expect(t1).toBe(t2);
  });

  it('returns different tokens for different values', () => {
    const ctx = createContext(MaskMode.TOKENIZE);
    const t1 = getOrCreateToken('hello', ctx);
    const t2 = getOrCreateToken('world', ctx);
    expect(t1).not.toBe(t2);
  });
});

describe('getOrCreateLabel', () => {
  it('generates incrementing labels', () => {
    const ctx = createContext(MaskMode.PSEUDONYMIZE);
    const l1 = getOrCreateLabel('EMAIL', 'a@b.com', ctx);
    const l2 = getOrCreateLabel('EMAIL', 'c@d.com', ctx);
    expect(l1).toBe('EMAIL_1');
    expect(l2).toBe('EMAIL_2');
  });

  it('returns same label for same value', () => {
    const ctx = createContext(MaskMode.PSEUDONYMIZE);
    const l1 = getOrCreateLabel('EMAIL', 'a@b.com', ctx);
    const l2 = getOrCreateLabel('EMAIL', 'a@b.com', ctx);
    expect(l1).toBe(l2);
  });
});

describe('extractTokenMap', () => {
  it('inverts the context token map', () => {
    const ctx = createContext(MaskMode.TOKENIZE);
    getOrCreateToken('original', ctx);
    const inverted = extractTokenMap(ctx);
    const entries = Object.entries(inverted);
    expect(entries).toHaveLength(1);
    expect(entries[0]![1]).toBe('original');
  });
});

describe('walk', () => {
  const emailDetector: PIIDetector = {
    id: 'test-email',
    label: 'Test Email',
    category: PIICategory.CONTACT,
    detect: (v) => v.includes('@'),
    mask: () => '[MASKED]',
  };

  it('walks nested objects', () => {
    const ctx = createContext(MaskMode.MASK);
    const result = walk(
      { user: { email: 'a@b.com', age: 25 } },
      undefined,
      [emailDetector],
      ctx,
      false,
    );
    expect(result).toEqual({ user: { email: '[MASKED]', age: 25 } });
  });

  it('walks arrays', () => {
    const ctx = createContext(MaskMode.MASK);
    const result = walk(
      ['a@b.com', 'hello'],
      undefined,
      [emailDetector],
      ctx,
      false,
    );
    expect(result).toEqual(['[MASKED]', 'hello']);
  });

  it('handles circular references', () => {
    const ctx = createContext(MaskMode.MASK);
    const obj: Record<string, unknown> = { email: 'a@b.com' };
    obj['self'] = obj;
    // Should not throw
    const result = walk(obj, undefined, [emailDetector], ctx, false) as Record<string, unknown>;
    expect(result['email']).toBe('[MASKED]');
  });
});
