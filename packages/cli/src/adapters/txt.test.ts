import { describe, it, expect } from 'vitest';
import { parseTxt, txtToString } from './txt';

describe('parseTxt', () => {
  it('returns the input string unchanged', () => {
    expect(parseTxt('hello world')).toBe('hello world');
  });
});

describe('txtToString', () => {
  it('returns the input string unchanged', () => {
    expect(txtToString('hello world')).toBe('hello world');
  });
});
