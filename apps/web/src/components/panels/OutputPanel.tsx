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
    <div className="flex flex-col h-full border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border-muted)]">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Output</span>
        <button
          onClick={handleCopy}
          disabled={!output}
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {copied ? (
            <Check size={14} className="text-[var(--color-success)]" />
          ) : (
            <Copy size={14} />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className={`flex-1 min-h-0 overflow-auto p-4 ${isPending ? 'animate-pulse opacity-70' : ''}`}>
        {output ? (
          <HighlightedCode code={output} lang={lang} />
        ) : (
          <span className="text-[var(--color-text-disabled)] text-sm font-mono">
            Transformed result will appear here…
          </span>
        )}
      </div>
    </div>
  );
}
