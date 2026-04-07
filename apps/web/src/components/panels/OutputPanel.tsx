import { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { track } from '@vercel/analytics';
import { HighlightedCode } from '../code/HighlightedCode.js';

interface OutputPanelProps {
  output: string;
  isPending: boolean;
  format: 'string' | 'object' | 'array';
}

export function OutputPanel({ output, isPending, format }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);

  const lang = useMemo(
    () => (format === 'object' || format === 'array' ? ('json' as const) : ('text' as const)),
    [format],
  );

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    track('output_copied');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)]">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          Output
        </span>
        <button
          onClick={handleCopy}
          disabled={!output}
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {copied ? (
            <Check size={13} className="text-[var(--color-success)]" />
          ) : (
            <Copy size={13} />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div
        className={`flex-1 min-h-0 overflow-auto bg-code-bg rounded-b-lg ${isPending ? 'animate-pulse opacity-70' : ''}`}
      >
        {output ? (
          <HighlightedCode code={output} lang={lang} showLineNumbers={false} />
        ) : (
          <p className="p-4 text-[#64748b] text-[13px] font-mono">Masked output appears here…</p>
        )}
      </div>
    </div>
  );
}
