import { describe, it, expect } from 'vitest';
import { parseCSV, csvToString } from './csv';

describe('parseCSV', () => {
  it('parses basic CSV', () => {
    const input = 'name,email\nJohn,john@example.com\nJane,jane@example.com';
    const { headers, rows } = parseCSV(input);
    expect(headers).toEqual(['name', 'email']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(['John', 'john@example.com']);
    expect(rows[1]).toEqual(['Jane', 'jane@example.com']);
  });

  it('handles quoted fields', () => {
    const input = 'name,address\nJohn,"123 Main St, Apt 4"';
    const { rows } = parseCSV(input);
    expect(rows[0]![1]).toBe('123 Main St, Apt 4');
  });

  it('handles escaped quotes', () => {
    const input = 'name,note\nJohn,"said ""hello"""';
    const { rows } = parseCSV(input);
    expect(rows[0]![1]).toBe('said "hello"');
  });

  it('returns empty for empty input', () => {
    const { headers, rows } = parseCSV('');
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });

  it('skips blank lines', () => {
    const input = 'a,b\n1,2\n\n3,4\n';
    const { rows } = parseCSV(input);
    expect(rows).toHaveLength(2);
  });
});

describe('csvToString', () => {
  it('converts rows to CSV string', () => {
    const rows = [
      ['name', 'email'],
      ['John', 'john@example.com'],
    ];
    const result = csvToString(rows);
    expect(result).toBe('name,email\nJohn,john@example.com');
  });

  it('quotes fields with commas', () => {
    const rows = [
      ['name', 'addr'],
      ['John', '123 Main, Apt 4'],
    ];
    const result = csvToString(rows);
    expect(result).toContain('"123 Main, Apt 4"');
  });

  it('escapes quotes in fields', () => {
    const rows = [['note'], ['said "hello"']];
    const result = csvToString(rows);
    expect(result).toContain('"said ""hello"""');
  });
});
