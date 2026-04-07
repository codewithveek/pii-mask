import { ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-(--color-border) bg-[var(--color-surface)]">
      <div className="flex items-center gap-2">
        <ShieldCheck size={20} className="text-accent" />
        <span className="text-base font-semibold text-text-primary tracking-tight">pii-mask</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
          Client-side only
        </span>
        <a
          href="https://pii-mask.dev/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-muted)] transition-colors duration-150"
        >
          Docs
        </a>
      </div>
    </header>
  );
}
