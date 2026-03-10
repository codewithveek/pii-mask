import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('jwt detector', () => {
  // Create a minimal valid JWT: {"alg":"HS256","typ":"JWT"}.{}.signature
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(JSON.stringify({ sub: '1234567890' })).replace(/=/g, '');
  const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const validJWT = `${header}.${payload}.${signature}`;

  const masker = createMasker({ mode: 'mask', only: ['jwt'] });

  it('detects a valid JWT', () => {
    const { detections } = masker.maskString(validJWT);
    expect(detections).toContain('jwt');
  });

  it('does not detect an invalid JWT', () => {
    const { detections } = masker.maskString('not.a.jwt');
    expect(detections).not.toContain('jwt');
  });

  it('always redacts regardless of mode', () => {
    const { result } = masker.maskString(validJWT);
    expect(result).toBe('[REDACTED]');
  });

  it('redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['jwt'] });
    const { result } = redacter.maskString(validJWT);
    expect(result).toBe('[REDACTED]');
  });

  it('redacts in substitute mode (secrets always redact)', () => {
    const substitutor = createMasker({ mode: 'substitute', only: ['jwt'] });
    const { result } = substitutor.maskString(validJWT);
    expect(result).toBe('[REDACTED]');
  });

  it('redacts in pseudonymize mode (secrets always redact)', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['jwt'] });
    const { result } = pseudonymizer.maskString(validJWT);
    expect(result).toBe('[REDACTED]');
  });
});
