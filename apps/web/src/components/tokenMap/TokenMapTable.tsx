import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { downloadFile } from '../../lib/downloadFile.js';

interface TokenMapTableProps {
  tokenMap: Record<string, string>;
}

export function TokenMapTable({ tokenMap }: TokenMapTableProps) {
  const [copied, setCopied] = useState(false);
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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleCopyJson}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
        >
          {copied ? (
            <Check size={12} className="text-[var(--color-success)]" />
          ) : (
            <Copy size={12} />
          )}
          {copied ? 'Copied' : 'Copy as JSON'}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
        >
          <Download size={12} />
          Download token-map.json
        </button>
      </div>
      <div className="rounded-md border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <th className="text-left px-3 py-2 text-[var(--color-text-secondary)] font-medium">
                Token
              </th>
              <th className="text-left px-3 py-2 text-[var(--color-text-secondary)] font-medium">
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
                <td className="px-3 py-2 text-[var(--color-detection)]">{token}</td>
                <td className="px-3 py-2 text-[var(--color-text-primary)]">{original}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
