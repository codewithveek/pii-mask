import type { MaskMode } from '@pii-mask/core';
import { track } from '@vercel/analytics';

interface ModeSelectorProps {
  mode: MaskMode;
  onModeChange: (mode: MaskMode) => void;
}

const modes: Array<{ value: MaskMode; label: string; tooltip: string }> = [
  { value: 'mask', label: 'Mask', tooltip: 'Partially obscure — preserves type shape' },
  { value: 'redact', label: 'Redact', tooltip: 'Replace all PII with [REDACTED]' },
  { value: 'anonymize', label: 'Anonymize', tooltip: 'Replace with consistent labels (EMAIL_1)' },
  { value: 'tokenize', label: 'Tokenize', tooltip: 'Replace with reversible tokens' },
  { value: 'substitute', label: 'Substitute', tooltip: 'Replace with realistic fake data' },
];

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {modes.map((m) => (
        <button
          key={m.value}
          title={m.tooltip}
          onClick={() => {
            onModeChange(m.value);
            track('mode_changed', { mode: m.value });
          }}
          className={`px-3.5 py-2 text-sm font-medium rounded transition-colors duration-150 ${
            mode === m.value
              ? 'border border-[var(--color-accent)] text-[var(--color-text-primary)] bg-[var(--color-surface-2)]'
              : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-muted)]'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
