import { describe, it, expect } from 'vitest';
import { parseJSONL, jsonlToString } from './jsonl';

describe('parseJSONL', () => {
  it('parses multiple JSONL lines', () => {
    const input = '{"a":1}\n{"b":2}';
    const result = parseJSONL(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ a: 1 });
    expect(result[1]).toEqual({ b: 2 });
  });

  it('skips blank lines', () => {
    const input = '{"a":1}\n\n{"b":2}\n';
    const result = parseJSONL(input);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    const result = parseJSONL('');
    expect(result).toEqual([]);
  });
});

describe('jsonlToString', () => {
  it('serializes records as JSONL', () => {
    const result = jsonlToString([{ a: 1 }, { b: 2 }]);
    expect(result).toBe('{"a":1}\n{"b":2}');
  });
});
