import { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import type { MaskMode } from '@pii-mask/core';
import { generateCodeSample } from '../../lib/generateCodeSample.js';
import type { InputFormat } from '../../lib/detectFormat.js';
import { HighlightedCode } from '../code/HighlightedCode.js';

interface CodeSlideOverProps {
  open: boolean;
  onClose: () => void;
  mode: MaskMode;
  format: InputFormat;
  disabledDetectors: string[];
}

export function CodeSlideOver({
  open,
  onClose,
  mode,
  format,
  disabledDetectors,
}: CodeSlideOverProps) {
  const [copied, setCopied] = useState(false);
  const [installCopied, setInstallCopied] = useState(false);

  const code = generateCodeSample({ mode, format, disabledDetectors });

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function handleCopyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyInstall() {
    await navigator.clipboard.writeText('npm install @pii-mask/core');
    setInstallCopied(true);
    setTimeout(() => setInstallCopied(false), 2000);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg z-50 bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            Generated Code
          </span>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="relative rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] p-4">
            <button
              onClick={handleCopyCode}
              className="absolute top-2 right-2 flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
            >
              {copied ? (
                <Check size={12} className="text-[var(--color-success)]" />
              ) : (
                <Copy size={12} />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <HighlightedCode code={code} lang="typescript" />
          </div>

          <div className="mt-6">
            <p className="text-xs text-[var(--color-text-secondary)] mb-2">Install</p>
            <div className="relative flex items-center rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-2">
              <code className="text-[13px] font-mono text-[var(--color-text-primary)]">
                npm install @pii-mask/core
              </code>
              <button
                onClick={handleCopyInstall}
                className="ml-auto text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
              >
                {installCopied ? (
                  <Check size={12} className="text-[var(--color-success)]" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <a
              href="https://pii-mask.dev/docs/core/create-masker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-muted)] transition-colors duration-150"
            >
              Read the docs →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
