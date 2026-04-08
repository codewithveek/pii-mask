import { useState, useEffect } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import { downloadFile } from '../../lib/downloadFile.js';

interface TokenMapSlideOverProps {
  open: boolean;
  onClose: () => void;
  tokenMap: Record<string, string>;
}

export function TokenMapSlideOver({ open, onClose, tokenMap }: TokenMapSlideOverProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const entries = Object.entries(tokenMap);

  async function handleCopyJson() {
    await navigator.clipboard.writeText(JSON.stringify(tokenMap, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    downloadFile(JSON.stringify(tokenMap, null, 2), 'token-map.json', 'application/json');
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Token Map</span>
          <button
            onClick={onClose}
            className="text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {entries.length === 0 ? (
            <p className="text-xs text-[var(--color-text-disabled)]">
              No tokens generated. Use tokenize mode to generate reversible tokens.
            </p>
          ) : (
            <>
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                Reversible token → original PII mappings for this session.
              </p>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors duration-150"
                >
                  {copied ? (
                    <Check size={12} className="text-[var(--color-success)]" />
                  ) : (
                    <Copy size={12} />
                  )}
                  {copied ? 'Copied' : 'Copy JSON'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors duration-150"
                >
                  <Download size={12} />
                  Download
                </button>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                      <th className="text-left px-3 py-2 text-[var(--color-text-secondary)] font-semibold text-[11px] uppercase tracking-wider">
                        Token
                      </th>
                      <th className="text-left px-3 py-2 text-[var(--color-text-secondary)] font-semibold text-[11px] uppercase tracking-wider">
                        Original
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(([token, original]) => (
                      <tr
                        key={token}
                        className="border-b border-[var(--color-border)] last:border-b-0"
                      >
                        <td className="px-3 py-2 text-[var(--color-detection)]">{token}</td>
                        <td className="px-3 py-2 text-[var(--color-text-primary)]">{original}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
