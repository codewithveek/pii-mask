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
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg z-50 bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <span className="text-base font-semibold text-[var(--color-text-primary)]">
            Token Map
          </span>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {entries.length === 0 ? (
            <p className="text-sm text-[var(--color-text-disabled)]">
              No tokens generated. Use tokenize mode to generate reversible tokens.
            </p>
          ) : (
            <>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Map of reversible tokens to original PII values. Use this to restore originals after processing.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
                >
                  {copied ? (
                    <Check size={13} className="text-[var(--color-success)]" />
                  ) : (
                    <Copy size={13} />
                  )}
                  {copied ? 'Copied' : 'Copy as JSON'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
                >
                  <Download size={13} />
                  Download
                </button>
              </div>
              <div className="rounded-md border border-[var(--color-border)] overflow-hidden">
                <table className="w-full text-sm font-mono">
                  <thead>
                    <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                      <th className="text-left px-4 py-2.5 text-[var(--color-text-secondary)] font-medium text-xs">
                        Token
                      </th>
                      <th className="text-left px-4 py-2.5 text-[var(--color-text-secondary)] font-medium text-xs">
                        Original Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(([token, original]) => (
                      <tr
                        key={token}
                        className="border-b border-[var(--color-border-muted)] last:border-b-0"
                      >
                        <td className="px-4 py-2.5 text-[var(--color-detection)]">{token}</td>
                        <td className="px-4 py-2.5 text-[var(--color-text-primary)]">{original}</td>
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
