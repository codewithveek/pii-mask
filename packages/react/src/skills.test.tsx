// Task checks for packages/react/skills/mask-pii-react.
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, renderHook } from '@testing-library/react';
import { MaskPII, usePIIMaskTable } from './index';

describe('skill: mask-pii-react', () => {
  it('MaskPII hides the value unless revealed', () => {
    const masked = render(<MaskPII mode="redact">jane@example.com</MaskPII>);
    expect(masked.container.textContent).not.toContain('jane@example.com');
    expect(masked.container.querySelector('[data-pii-masked="true"]')).not.toBeNull();
    const revealed = render(
      <MaskPII mode="redact" reveal>
        jane@example.com
      </MaskPII>,
    );
    expect(revealed.container.textContent).toBe('jane@example.com');
  });

  it('a table shares one session; only maskColumns are masked', () => {
    const rows = [
      { name: 'Jane Doe', email: 'a@b.com', plan: 'pro' },
      { name: 'John Roe', email: 'a@b.com', plan: 'free' },
    ];
    const { result } = renderHook(() =>
      usePIIMaskTable(rows, { mode: 'pseudonymize', maskColumns: ['email'] }),
    );
    expect(result.current.maskedData.map((r) => r.email)).toEqual(['EMAIL_1', 'EMAIL_1']);
    expect(result.current.maskedData[0]!.name).toBe('Jane Doe');
  });
});
