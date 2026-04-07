import { useRef, useCallback } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lineCount = Math.max((value || PLACEHOLDER).split('\n').length, 1);

  const handleScroll = useCallback(() => {
    const ta = textareaRef.current;
    const gutter = ta?.parentElement?.querySelector('.line-numbers') as HTMLElement | null;
    if (ta && gutter) gutter.scrollTop = ta.scrollTop;
  }, []);

  return (
    <div className="flex flex-col h-full border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border-muted)]">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Input</span>
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-disabled)]">
          <Lock size={12} />
          Processed locally
        </span>
      </div>
      {inputTooLarge && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-warning)]/10 text-[var(--color-warning)] text-sm">
          <AlertTriangle size={14} />
          Input exceeds 500KB limit. Transformation disabled.
        </div>
      )}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="line-numbers py-3" aria-hidden>
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          className="flex-1 w-full py-3 pr-4 bg-transparent text-sm font-mono text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] resize-none focus:outline-none overflow-auto leading-[1.5]"
        />
      </div>
    </div>
  );
}
