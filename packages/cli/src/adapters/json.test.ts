import { describe, it, expect } from 'vitest';
import { parseJSON, jsonToString } from './json';

describe('parseJSON', () => {
  it('parses a JSON object', () => {
    const result = parseJSON('{"name":"John"}');
    expect(result).toEqual({ name: 'John' });
  });

  it('parses a JSON array', () => {
    const result = parseJSON('[1,2,3]');
    expect(result).toEqual([1, 2, 3]);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJSON('not json')).toThrow();
  });
});

describe('jsonToString', () => {
  it('serializes with indentation', () => {
    const result = jsonToString({ a: 1 });
    expect(result).toBe('{\n  "a": 1\n}');
  });
});
