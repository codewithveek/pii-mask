import { Lock, AlertTriangle } from 'lucide-react';

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  inputTooLarge: boolean;
}

const PLACEHOLDER = `{
  "name": "Emeka Okafor",
  "email": "emeka.okafor@example.com",
  "phone": "+2348012345678",
  "nin": "12345678901",
  "address": "15 Admiralty Way, Lekki Phase 1, Lagos"
}`;

export function InputPanel({ value, onChange, inputTooLarge }: InputPanelProps) {
  return (
    <div className="flex flex-col min-h-0 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border-muted)]">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">Input</span>
        <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-disabled)]">
          <Lock size={10} />
          Processed locally
        </span>
      </div>
      {inputTooLarge && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-warning)]/10 text-[var(--color-warning)] text-xs">
          <AlertTriangle size={12} />
          Input exceeds 500KB limit. Transformation disabled.
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDER}
        spellCheck={false}
        className="flex-1 w-full p-3 bg-transparent text-[13px] font-mono text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] resize-none focus:outline-none"
      />
    </div>
  );
}
