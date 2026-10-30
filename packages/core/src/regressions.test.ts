import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { createMasker } from './masker.js';

const redact = createMasker({ mode: 'redact' });

describe('walker', () => {
  it('masks an object referenced twice (not cyclically) at every occurrence', () => {
    const shared = { email: 'a@b.com' };
    const { result } = redact.mask({ x: shared, y: shared });
    expect(result).toEqual({ x: { email: '[REDACTED]' }, y: { email: '[REDACTED]' } });
  });

  it('replaces cycles with [Circular] and still serializes', () => {
    const obj: Record<string, unknown> = { email: 'a@b.com' };
    obj['self'] = obj;
    expect(JSON.parse(redact.maskObject(obj).result)).toEqual({
      email: '[REDACTED]',
      self: '[Circular]',
    });
  });

  it('serializes Dates, BigInts, Maps, Sets and Errors instead of dropping them', () => {
    const date = new Date('2024-01-02T03:04:05.000Z');
    const { result } = redact.mask({
      at: date,
      n: 10n,
      tags: new Set(['a@b.com']),
      meta: new Map([['email', 'a@b.com']]),
      err: new Error('failed for a@b.com'),
    });
    const r = result as unknown as Record<string, Record<string, unknown>>;
    expect(r['at']).toBe('2024-01-02T03:04:05.000Z');
    expect(r['n']).toBe(10n);
    expect(r['tags']).toEqual(['[REDACTED]']);
    expect(r['meta']).toEqual({ email: '[REDACTED]' });
    expect(r['err']!['type']).toBe('Error');
    expect(r['err']!['message']).toBe('failed for [REDACTED]');
    expect(String(r['err']!['stack'])).not.toContain('a@b.com');
    expect(() => redact.maskObject({ n: 1n })).not.toThrow();
  });

  it('masks numbers under sensitive keys', () => {
    const { result } = redact.mask({
      password: 123456,
      ssn: 123456789,
      phone: 4155552671,
      age: 30,
    });
    expect(result).toEqual({
      password: '[REDACTED]',
      ssn: '[REDACTED]',
      phone: '[REDACTED]',
      age: 30,
    });
  });

  it('redacts whole credential containers', () => {
    const { result } = redact.mask({ cookies: { sid: 'abc', theme: 'dark' } });
    expect(result).toEqual({ cookies: '[REDACTED]' });
  });

  it('keeps a __proto__ key as data without touching prototypes', () => {
    const input = JSON.parse('{"__proto__":{"email":"a@b.com"},"x":1}') as Record<string, unknown>;
    const { result } = redact.maskObject(input);
    expect(JSON.parse(result)).toEqual(JSON.parse('{"__proto__":{"email":"[REDACTED]"},"x":1}'));
    expect(({} as Record<string, unknown>)['email']).toBeUndefined();
  });

  it('truncates objects nested beyond maxDepth', () => {
    const shallow = createMasker({ mode: 'redact', maxDepth: 2 });
    expect(shallow.mask({ a: { b: { c: 'x' } } }).result).toEqual({ a: { b: '[Truncated]' } });
  });

  it('keyNameOnly never falls back to value patterns', () => {
    const m = createMasker({ mode: 'redact', keyNameOnly: true });
    expect(m.mask({ note: 'mail a@b.com', password: 'x' }).result).toEqual({
      note: 'mail a@b.com',
      password: '[REDACTED]',
    });
  });
});

describe('tokens and restore', () => {
  it('uses 64-bit tokens', () => {
    const m = createMasker({ mode: 'tokenize' });
    expect(m.maskString('a@b.com').result).toMatch(/^<<PII_[a-f0-9]{16}>>$/);
  });

  it('restoreObject survives originals containing quotes and backslashes', () => {
    const m = createMasker({ mode: 'tokenize' });
    const input = { name: 'Bob "The" \\Builder', email: 'a"b@c.com' };
    const { result, tokenMap } = m.maskObject({ fullName: input.name, note: 'x a@b.com' });
    expect(m.restoreObject(result, tokenMap)).toEqual({ fullName: input.name, note: 'x a@b.com' });
  });

  it('restore matches whole labels (EMAIL_1 does not match inside EMAIL_10)', () => {
    const m = createMasker({ mode: 'pseudonymize' });
    const session = m.createSession();
    for (let i = 1; i <= 10; i++) m.maskString(`u${i}@x.com`, undefined, session);
    const tokenMap = m.getTokenMap(session);
    expect(m.restore('EMAIL_1 EMAIL_10', tokenMap)).toBe('u1@x.com u10@x.com');
  });

  it('numbers pseudonym labels per type', () => {
    const m = createMasker({ mode: 'pseudonymize' });
    expect(m.mask({ a: 'a@b.com', b: '+14155552671', c: 'c@d.com' }).result).toEqual({
      a: 'EMAIL_1',
      b: 'PHONE_1',
      c: 'EMAIL_2',
    });
  });

  it('restoreValue restores a structured mask() result', () => {
    const m = createMasker({ mode: 'tokenize' });
    const { result, tokenMap } = m.mask({ list: ['a@b.com'], nested: { ip: '10.1.2.3' } });
    expect(m.restoreValue(result, tokenMap)).toEqual({
      list: ['a@b.com'],
      nested: { ip: '10.1.2.3' },
    });
  });
});

describe('options', () => {
  it('requires a faker instance for substitute mode', () => {
    expect(() => createMasker({ mode: 'substitute' })).toThrow(/faker/);
    expect(() => createMasker({ mode: 'substitute', faker })).not.toThrow();
  });

  it('rejects unknown modes', () => {
    expect(() => createMasker({ mode: 'blur' as never })).toThrow(/Unknown mode/);
  });

  it('accepts GB and UK for the UK National Insurance detector', () => {
    for (const region of ['GB', 'UK']) {
      const m = createMasker({ mode: 'redact', regions: [region] });
      expect(m.detectString('AB123456C').detections).toEqual(['nin-uk']);
    }
  });
});

describe('detector accuracy', () => {
  it('labels 16-digit cards as cards, not Indonesian NIKs', () => {
    expect(redact.detectString('4111111111111111').detections).toEqual(['credit-card']);
    expect(redact.detectString('5555555555554444').detections).toEqual(['credit-card']);
  });

  it('reaches the BVN detector under a bvn key', () => {
    expect(redact.maskString('12345678901', 'bvn').detections).toEqual(['bvn-ng']);
  });

  it.each([
    ['ms timestamp', '1730246400000'],
    ['10-digit order id', '4155552671'],
    ['snowflake id', '1100000000000104729'],
    ['12-digit id', '276403465037'],
    ['11-digit id', '98765432109'],
    ['ISO date', '2024-01-15'],
    ['month and year', 'Released in March 2023'],
    ['ISO timestamp', '2024-10-30T12:00:00.000Z'],
  ])('does not flag a bare %s', (_label, value) => {
    expect(redact.detectString(value).detections).toEqual([]);
  });

  it('never masks part of a longer digit run in text', () => {
    expect(redact.maskString('ts=1730246400000 done').result).toBe('ts=1730246400000 done');
  });

  it.each([
    ['product.name', { product: { name: 'iPhone 15' } }],
    ['pino logger name', { name: 'api', hostname: 'web-1' }],
    ['capacity', { capacity: '10GB' }],
    ['opacity', { opacity: '0.5' }],
    ['ui state', { state: 'active' }],
    ['commitHash', { commitHash: 'abc123' }],
    ['bypass', { bypass: 'yes' }],
    ['secretary', { secretary: 'Jane' }],
    ['trace id', { trace_id: '4bf92f3577b34da6a3ce929d0e0e4736' }],
    ['createdAt', { createdAt: '2024-01-15' }],
  ])('leaves %s alone', (_label, input) => {
    expect(redact.mask(input).result).toEqual(input);
  });

  it.each([
    ['authorization', { authorization: 'Bearer abc.def' }],
    ['cookie', { cookie: 'sid=xyz' }],
    ['x-api-key', { 'x-api-key': 'k123' }],
    ['passwd', { passwd: 'hunter2' }],
    ['pwd', { pwd: 'hunter2' }],
    ['refresh_token', { refresh_token: 'r1' }],
    ['client_secret', { client_secret: 's1' }],
    ['name that looks like a person', { name: 'Jane Doe' }],
    ['first_name', { first_name: 'Jane' }],
    ['billing_city', { billing_city: 'Lagos' }],
    ['zip as number', { zip: 94107 }],
    ['ssn without dashes', { ssn: '123456789' }],
    ['dob in DD/MM/YYYY', { dob: '25/12/1990' }],
    ['non-checksummed VIN', { vin: 'WVWZZZ1JZXW000001' }],
  ])('masks %s', (_label, input) => {
    const [key] = Object.keys(input);
    expect((redact.mask(input).result as Record<string, unknown>)[key!]).toBe('[REDACTED]');
  });

  it('masks compressed IPv6 in text completely', () => {
    expect(redact.maskString('from 2001:db8::8a2e:370:7334 ok').result).toBe('from [REDACTED] ok');
  });

  it('finds spaced IBANs in text, even before an upper-case word', () => {
    expect(redact.maskString('IBAN GB82 WEST 1234 5698 7654 32 THEN').result).toBe(
      'IBAN [REDACTED] THEN',
    );
  });

  it('finds dates of birth in text only with birth context', () => {
    expect(redact.maskString('born on 25/12/1990, joined 2024-01-15').result).toBe(
      'born on [REDACTED], joined 2024-01-15',
    );
  });

  it('does not stitch adjacent numbers into a card', () => {
    expect(redact.maskString('qty 10 20 30 40 50 60 70').result).toBe('qty 10 20 30 40 50 60 70');
  });

  it('hides most of a short email local part', () => {
    const m = createMasker({ mode: 'mask' });
    expect(m.maskString('jane@acme.com').result).toBe('j***@acme.com');
  });

  it('resolves overlapping text matches without re-scanning masked output', () => {
    const m = createMasker({ mode: 'substitute', faker });
    const { detections } = m.maskString('call +14155552671 or mail a@b.com');
    expect(detections).toEqual(['phone-global', 'email']);
  });
});

describe('regex performance', () => {
  it.each([
    ['dotted string', 'a.'.repeat(50_000)],
    ['email without TLD', 'a'.repeat(50_000) + '@' + 'b.'.repeat(50_000)],
    ['colons', 'a:'.repeat(50_000)],
    ['digits and spaces', '1 '.repeat(50_000)],
    ['birth words', 'born '.repeat(20_000)],
  ])('scans a long %s in linear time', (_label, input) => {
    const start = performance.now();
    redact.maskString(input);
    expect(performance.now() - start).toBeLessThan(1500);
  });
});
