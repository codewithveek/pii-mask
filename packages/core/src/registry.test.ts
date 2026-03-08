import { describe, it, expect, vi } from 'vitest';
import { registry } from './registry.js';
import type { PIIDetector } from './types.js';
import { PIICategory } from './types.js';

describe('DetectorRegistry', () => {
  it('lists registered detectors', () => {
    const list = registry.list();
    expect(list.length).toBeGreaterThan(0);
  });

  it('resolves with only filter', () => {
    const resolved = registry.resolve({ only: ['email'] });
    expect(resolved).toHaveLength(1);
    expect(resolved[0]!.id).toBe('email');
  });

  it('resolves with disable filter', () => {
    const all = registry.resolve({});
    const withoutEmail = registry.resolve({ disable: ['email'] });
    expect(withoutEmail.length).toBe(all.length - 1);
    expect(withoutEmail.find((d) => d.id === 'email')).toBeUndefined();
  });

  it('resolves with category-based only filter', () => {
    const contacts = registry.resolve({ only: ['contact'] });
    expect(contacts.length).toBeGreaterThan(0);
    expect(contacts.every((d) => d.category === PIICategory.CONTACT)).toBe(true);
  });

  it('warns on duplicate registration without override', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const detector: PIIDetector = {
      id: 'email',
      label: 'Duplicate Email',
      category: PIICategory.CONTACT,
      detect: () => false,
      mask: () => '',
    };
    registry.register(detector);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('silently replaces with override option', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const detector: PIIDetector = {
      id: 'email',
      label: 'Override Email',
      category: PIICategory.CONTACT,
      detect: () => false,
      mask: () => '',
    };
    registry.register(detector, { override: true });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
