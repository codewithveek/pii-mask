// Task checks for packages/nlp/skills/detect-names-in-text.
import { describe, it, expect } from 'vitest';
import { createMasker } from '@pii-mask/core';
import { africanNames } from '@pii-mask/core/lexicon/africa';
import { buildCompromiseDetectors } from './index';

describe('skill: detect-names-in-text', () => {
  it('masks only the entities in a sentence', () => {
    const masker = createMasker({ mode: 'redact', extend: buildCompromiseDetectors() });
    const { result, detections } = masker.maskString('John Smith lives in New York');
    expect(result).toBe('[REDACTED] lives in [REDACTED]');
    expect(detections).toEqual(expect.arrayContaining(['nlp-person', 'nlp-place']));
    expect(masker.maskString('The deploy finished without errors').result).toBe(
      'The deploy finished without errors',
    );
  });

  it('customLexicon catches a name compromise misses', () => {
    const text = 'ticket from Emeka Okafor';
    const plain = createMasker({ mode: 'redact', extend: buildCompromiseDetectors({ entities: ['Person'] }) });
    expect(plain.maskString(text).result).toContain('Okafor');
    const taught = createMasker({
      mode: 'redact',
      extend: buildCompromiseDetectors({
        entities: ['Person'],
        customLexicon: { emeka: 'Person', okafor: 'Person' },
      }),
    });
    expect(taught.maskString(text).result).toBe('ticket from [REDACTED]');
  });

  it('regional lexicons from core plug into customLexicon', () => {
    const masker = createMasker({
      mode: 'redact',
      extend: buildCompromiseDetectors({ customLexicon: { ...africanNames } }),
    });
    expect(masker.maskString('ticket from Emeka Okafor').result).toBe('ticket from [REDACTED]');
  });
});
