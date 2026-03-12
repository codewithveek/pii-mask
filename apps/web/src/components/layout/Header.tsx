import { Lock } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold text-[var(--color-text-primary)]">
          pii-mask
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
          <Lock size={12} />
          Data never leaves your browser
        </span>
        <a
          href="https://pii-mask.dev/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
        >
          Docs ↗
        </a>
      </div>
    </header>
  );
}
