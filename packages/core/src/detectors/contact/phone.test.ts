import { describe, it, expect } from 'vitest';
import { createMasker } from '../../masker.js';

describe('phone-global detector', () => {
  const masker = createMasker({ mode: 'mask', only: ['phone-global'] });

  it('detects a valid phone number', () => {
    const { detections } = masker.maskString('+14155552671');
    expect(detections).toContain('phone-global');
  });

  it('does not detect an invalid phone number', () => {
    const { detections } = masker.maskString('12345');
    expect(detections).not.toContain('phone-global');
  });

  it('masks phone preserving last 4 digits', () => {
    const { result } = masker.maskString('+14155552671');
    expect(result).toContain('2671');
    expect(result).toContain('***');
  });

  it('fully redacts in redact mode', () => {
    const redacter = createMasker({ mode: 'redact', only: ['phone-global'] });
    const { result } = redacter.maskString('+14155552671');
    expect(result).toBe('[REDACTED]');
  });

  it('round-trips in tokenize mode', () => {
    const tokenizer = createMasker({ mode: 'tokenize', only: ['phone-global'] });
    const { result, tokenMap } = tokenizer.maskString('+14155552671');
    expect(result).toMatch(/^<<PII_[a-f0-9]{8}>>$/);
    expect(tokenizer.restore(result, tokenMap)).toBe('+14155552671');
  });

  it('generates label in pseudonymize mode', () => {
    const pseudonymizer = createMasker({ mode: 'pseudonymize', only: ['phone-global'] });
    const { result } = pseudonymizer.maskString('+14155552671');
    expect(result).toBe('PHONE_1');
  });

  it('generates label in anonymize mode', () => {
    const anonymizer = createMasker({ mode: 'anonymize', only: ['phone-global'] });
    const { result } = anonymizer.maskString('+14155552671');
    expect(result).toBe('PHONE_1');
  });

  it('generates plausible phone in substitute mode', () => {
    const substitutor = createMasker({ mode: 'substitute', only: ['phone-global'] });
    const { result } = substitutor.maskString('+14155552671');
    expect(result).not.toBe('+14155552671');
    expect(result.length).toBeGreaterThan(5);
  });

  describe('local number formats (no country code)', () => {
    // Nigeria — local numbers start with 0, 11 digits
    it('detects Nigerian local number (08034567890)', () => {
      const { detections } = masker.maskString('08034567890');
      expect(detections).toContain('phone-global');
    });

    it('masks Nigerian local number preserving last 4', () => {
      const { result } = masker.maskString('08034567890');
      expect(result).toContain('7890');
      expect(result).toContain('***');
    });

    // India — 10-digit mobile starting with 0 prefix
    it('detects Indian local number (09876543210)', () => {
      const { detections } = masker.maskString('09876543210');
      expect(detections).toContain('phone-global');
    });

    // South Africa — 10 digits starting with 0
    it('detects South African local number (0821234567)', () => {
      const { detections } = masker.maskString('0821234567');
      expect(detections).toContain('phone-global');
    });

    // Germany — local mobile format
    it('detects German local number (01701234567)', () => {
      const { detections } = masker.maskString('01701234567');
      expect(detections).toContain('phone-global');
    });

    // Kenya — 10 digits starting with 0
    it('detects Kenyan local number (0722123456)', () => {
      const { detections } = masker.maskString('0722123456');
      expect(detections).toContain('phone-global');
    });

    // Freeform text with Nigerian local number (compact format)
    it('detects Nigerian number in freeform text', () => {
      const { detections } = masker.maskString('Call me on 08034567890 please');
      expect(detections).toContain('phone-global');
    });

    // International format for Nigeria still works
    it('still detects Nigerian international format', () => {
      const { detections } = masker.maskString('+2348034567890');
      expect(detections).toContain('phone-global');
    });
  });
});
