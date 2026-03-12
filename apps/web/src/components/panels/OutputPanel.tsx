import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { track } from '@vercel/analytics';

interface OutputPanelProps {
  output: string;
  isPending: boolean;
}

export function OutputPanel({ output, isPending }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    track('output_copied');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col min-h-72 h-full border border-border rounded-md bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-muted">
        <span className="text-xs font-medium text-text-secondary">Output</span>
        <button
          onClick={handleCopy}
          disabled={!output}
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div
        className={`flex-1 p-3 overflow-auto font-mono text-[13px] text-text-primary whitespace-pre-wrap ${
          isPending ? 'animate-pulse opacity-70' : ''
        }`}
      >
        {output || <span className="text-text-disabled">Transformed result will appear here…</span>}
      </div>
    </div>
  );
}
