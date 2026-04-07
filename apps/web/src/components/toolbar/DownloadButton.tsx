import { Download } from 'lucide-react';
import { track } from '@vercel/analytics';
import { downloadFile } from '../../lib/downloadFile.js';
import type { InputFormat } from '../../lib/detectFormat.js';

interface DownloadButtonProps {
  output: string;
  format: InputFormat;
}

export function DownloadButton({ output, format }: DownloadButtonProps) {
  const disabled = !output;

  function handleDownload() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = format === 'string' ? 'txt' : 'json';
    const mime = format === 'string' ? 'text/plain' : 'application/json';
    downloadFile(output, `masked-output-${timestamp}.${ext}`, mime);
    track('download_clicked', { format: ext });
  }

  return (
    <button
      onClick={handleDownload}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
    >
      <Download size={14} />
      Download
    </button>
  );
}
