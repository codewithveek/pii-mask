import { describe, it, expect } from 'vitest';
import { Writable } from 'node:stream';
import pino from 'pino';
import winston from 'winston';
import { pinoMask } from './pino.js';
import { winstonMask } from './winston.js';
import { maskedDestination } from './destination.js';

function sink() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _enc, cb) {
      lines.push(...chunk.toString().split('\n').filter(Boolean));
      cb();
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- log lines are free-form JSON
  return { lines, stream, json: () => lines.map((l) => JSON.parse(l) as Record<string, any>) };
}

describe('pinoMask', () => {
  it('masks the merging object, the message and interpolation args', () => {
    const out = sink();
    const logger = pino({ ...pinoMask({ mode: 'redact' }) }, out.stream);
    logger.info({ user: { email: 'jane@acme.com' } }, 'login from %s by jane@acme.com', '10.1.2.3');
    const [line] = out.json();
    expect(line!['user']).toEqual({ email: '[REDACTED]' });
    expect(line!['msg']).toBe('login from [REDACTED] by [REDACTED]');
  });

  it('masks logged errors and keeps their type, message and stack', () => {
    const out = sink();
    const logger = pino({ ...pinoMask({ mode: 'redact' }) }, out.stream);
    logger.error(new TypeError('failed for jane@acme.com'));
    logger.info({ err: new Error('boom jane@acme.com') }, 'with err');
    const [first, second] = out.json();
    expect(first!['msg']).toBe('failed for [REDACTED]');
    expect(first!['err'].type).toBe('TypeError');
    expect(first!['err'].message).toBe('failed for [REDACTED]');
    expect(first!['err'].stack).toContain('TypeError: failed for [REDACTED]');
    expect(second!['err'].type).toBe('Error');
    expect(JSON.stringify(out.lines)).not.toContain('jane@acme.com');
  });

  it('masks pino-http style request headers', () => {
    const out = sink();
    const logger = pino({ ...pinoMask({ mode: 'redact' }) }, out.stream);
    logger.info({
      req: { headers: { authorization: 'Bearer x', cookie: 'sid=1', host: 'a.com' } },
    });
    expect(out.json()[0]!['req'].headers).toEqual({
      authorization: '[REDACTED]',
      cookie: '[REDACTED]',
      host: 'a.com',
    });
  });

  it('leaves pino built-in fields alone', () => {
    const out = sink();
    const logger = pino({ name: 'api', ...pinoMask({ mode: 'redact' }) }, out.stream);
    logger.info('ok');
    const [line] = out.json();
    expect(line!['name']).toBe('api');
    expect(line!['hostname']).toBeTypeOf('string');
    expect(line!['time']).toBeTypeOf('number');
  });
});

describe('maskedDestination', () => {
  it('masks child bindings and serialized errors on the final line', () => {
    const out = sink();
    const logger = pino({}, maskedDestination(out.stream, { mode: 'redact' }));
    logger.child({ email: 'kid@acme.com' }).error(new Error('x jane@acme.com'));
    const [line] = out.json();
    expect(line!['email']).toBe('[REDACTED]');
    expect(line!['err'].message).toBe('x [REDACTED]');
    expect(line!['level']).toBe(50);
  });

  it('masks non-JSON lines as text and buffers partial lines', () => {
    const out = sink();
    const dest = maskedDestination(out.stream, { mode: 'redact' });
    dest.write('plain a@b.com\n{"e":"c@d');
    dest.write('.com"}\ntrailing x@y.com');
    dest.flush();
    expect(out.lines).toEqual(['plain [REDACTED]', '{"e":"[REDACTED]"}', 'trailing [REDACTED]']);
  });
});

describe('winstonMask', () => {
  function logger() {
    const out = sink();
    const log = winston.createLogger({
      format: winston.format.combine(winstonMask({ mode: 'redact' }), winston.format.json()),
      transports: [new winston.transports.Stream({ stream: out.stream })],
    });
    return { out, log };
  }

  it('masks the message and metadata', () => {
    const { out, log } = logger();
    log.info('user jane@acme.com', { phone: '+14155552671', meta: { ip: '10.1.2.3' } });
    expect(out.json()[0]).toEqual({
      level: 'info',
      message: 'user [REDACTED]',
      phone: '[REDACTED]',
      meta: { ip: '[REDACTED]' },
    });
  });

  it('keeps the message and stack of a logged Error', () => {
    const { out, log } = logger();
    log.error(new Error('failed for jane@acme.com'));
    const [line] = out.json();
    expect(line!['message']).toBe('failed for [REDACTED]');
    expect(line!['stack']).toContain('Error: failed for [REDACTED]');
    expect(line!['type']).toBeUndefined();
  });
});
