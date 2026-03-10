import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { MaskPII } from './MaskPII';

describe('MaskPII', () => {
  afterEach(() => {
    cleanup();
  });

  it('masks email by default', () => {
    render(<MaskPII>test@example.com</MaskPII>);
    const el = screen.getByText((_, element) => {
      return (
        element?.getAttribute('data-pii-masked') === 'true' &&
        element?.textContent !== 'test@example.com'
      );
    });
    expect(el).toBeTruthy();
    expect(el.textContent).not.toBe('test@example.com');
  });

  it('renders raw value when reveal is true', () => {
    render(<MaskPII reveal>test@example.com</MaskPII>);
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('sets data-pii-masked to false when reveal is true', () => {
    render(<MaskPII reveal>test@example.com</MaskPII>);
    const el = screen.getByText('test@example.com');
    expect(el.getAttribute('data-pii-masked')).toBe('false');
  });

  it('applies className and style', () => {
    render(
      <MaskPII className="custom" style={{ color: 'red' }}>
        test@example.com
      </MaskPII>,
    );
    const el = document.querySelector('.custom');
    expect(el).toBeTruthy();
    expect((el as HTMLElement).style.color).toBe('red');
  });

  it('passes through non-PII text unchanged', () => {
    render(<MaskPII>Hello World</MaskPII>);
    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  it('supports redact mode', () => {
    render(<MaskPII mode="redact">test@example.com</MaskPII>);
    expect(screen.getByText('[REDACTED]')).toBeTruthy();
  });
});
