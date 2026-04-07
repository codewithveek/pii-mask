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
    <div className="flex items-center flex-wrap  gap-1 ">
      {modes.map((m) => (
        <button
          key={m.value}
          title={m.tooltip}
          onClick={() => {
            onModeChange(m.value);
            track('mode_changed', { mode: m.value });
          }}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap ${
            mode === m.value
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
