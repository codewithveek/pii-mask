import { Lock } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <span className="text-xl font-semibold text-[var(--color-text-primary)]">
          pii-mask
        </span>
      </div>
      <div className="flex items-center gap-5">
        <span className="hidden sm:flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
          <Lock size={14} />
          Data never leaves your browser
        </span>
        <a
          href="https://pii-mask.dev/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
        >
          Docs ↗
        </a>
      </div>
    </header>
  );
}
