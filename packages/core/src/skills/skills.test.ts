// Task checks for the Intent skills in packages/core/skills/. Each case runs the
// solution a skill recommends, and the mistake it warns about, against the
// same observable assertion.
import { describe, it, expect } from 'vitest';
import { Writable } from 'node:stream';
import pino from 'pino';
import { createMasker, pinoMask, maskedDestination, getOrCreateToken, MaskMode, PIICategory } from '../index.js';
import type { PIIDetector } from '../index.js';

const leaks = (output: unknown, ...originals: string[]) =>
  originals.some((o) => JSON.stringify(output).includes(o));

function sink() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _enc, cb) {
      lines.push(...chunk.toString().split('\n').filter(Boolean));
      cb();
    },
  });
  return { lines, stream };
}

describe('skill: mask-pii', () => {
  const record = { user: { email: 'jane@corp.com', ssn: '123-45-6789', age: 30 } };

  it('mask() returns a masked object of the same shape', () => {
    const { result } = createMasker({ mode: 'redact' }).mask(record);
    expect(leaks(result, 'jane@corp.com', '123-45-6789')).toBe(false);
    expect(result.user.age).toBe(30);
  });

  it('mistake: maskObject().result is a JSON string, not the object', () => {
    const { result } = createMasker({ mode: 'redact' }).maskObject(record);
    expect((result as unknown as typeof record).user).toBeUndefined();
  });

  it('tokenize round-trips through restoreValue()', () => {
    const masker = createMasker({ mode: 'tokenize' });
    const input = { note: 'mail a@b.com', fullName: 'Bob "The" Builder' };
    const { result, tokenMap } = masker.mask(input);
    expect(leaks(result, 'a@b.com', 'Bob')).toBe(false);
    expect(masker.restoreValue(result, tokenMap)).toEqual(input);
  });

  it('a session keeps labels stable across calls; separate calls collide', () => {
    const masker = createMasker({ mode: 'pseudonymize' });
    const session = masker.createSession();
    const a = masker.maskString('a@b.com', undefined, session).result;
    const b = masker.maskString('c@d.com', undefined, session).result;
    expect(a).not.toBe(b);
    // the mistake: no session — two different people get the same label
    expect(masker.maskString('a@b.com').result).toBe(masker.maskString('c@d.com').result);
  });

  it('substitute mode without faker throws', () => {
    expect(() => createMasker({ mode: 'substitute' })).toThrow(/faker/);
  });
});

describe('skill: mask-logs', () => {
  it('pinoMask() masks the message, args and merging object', () => {
    const out = sink();
    const logger = pino({ ...pinoMask({ mode: 'redact' }) }, out.stream);
    logger.info({ user: { email: 'jane@acme.com' } }, 'signup %s', 'kid@acme.com');
    expect(leaks(out.lines, 'jane@acme.com', 'kid@acme.com')).toBe(false);
  });

  it('mistake: formatters.log alone leaves msg unmasked', () => {
    const out = sink();
    const { formatters } = pinoMask({ mode: 'redact' });
    const logger = pino({ formatters }, out.stream);
    logger.info('signup jane@acme.com');
    expect(leaks(out.lines, 'jane@acme.com')).toBe(true);
  });

  it('maskedDestination() masks child bindings; pinoMask() does not', () => {
    const safe = sink();
    pino({}, maskedDestination(safe.stream, { mode: 'redact' }))
      .child({ email: 'kid@acme.com' })
      .info('x');
    expect(leaks(safe.lines, 'kid@acme.com')).toBe(false);

    const unsafe = sink();
    pino({ ...pinoMask({ mode: 'redact' }) }, unsafe.stream)
      .child({ email: 'kid@acme.com' })
      .info('x');
    expect(leaks(unsafe.lines, 'kid@acme.com')).toBe(true);
  });
});

describe('skill: custom-detectors', () => {
  const employeeId: PIIDetector = {
    id: 'employee-id',
    label: 'Employee ID',
    category: PIICategory.IDENTITY,
    detect: (value) => /^EMP-\d{6}$/.test(value.trim()),
    mask: (value, mode, ctx) =>
      mode === MaskMode.TOKENIZE ? getOrCreateToken(value, ctx) : '[REDACTED]',
    pattern: /\bEMP-\d{6}\b/g,
    prefilter: /EMP-/,
    keyPattern: /^employee_?id$/i,
  };

  it('detects, masks in text, and restores a custom ID', () => {
    const masker = createMasker({ mode: 'tokenize', extend: [employeeId] });
    expect(masker.detectString('EMP-123456').detections).toEqual(['employee-id']);
    expect(masker.detectString('EMP-12345').detections).toEqual([]);
    const { result, tokenMap } = masker.maskString('ticket from EMP-123456 today');
    expect(result).not.toContain('EMP-123456');
    expect(masker.restore(result, tokenMap)).toBe('ticket from EMP-123456 today');
    expect(masker.mask({ employee_id: 'E 12' }).detections).toEqual(['employee-id']);
  });

  it('mistake: a non-token value in tokenize mode cannot be restored', () => {
    const bad: PIIDetector = { ...employeeId, id: 'bad-employee-id', mask: () => 'EMP-XXXXXX' };
    const masker = createMasker({ mode: 'tokenize', extend: [bad], only: ['bad-employee-id'] });
    const { result, tokenMap } = masker.maskString('EMP-123456');
    expect(masker.restore(result, tokenMap)).not.toBe('EMP-123456');
  });

  it('bare ambiguous digits need a key', () => {
    const masker = createMasker();
    expect(masker.detectString('276403465037').detections).toEqual([]);
    expect(masker.detectString('276403465037', 'aadhaar').detections).toEqual(['aadhaar-in']);
  });
});
