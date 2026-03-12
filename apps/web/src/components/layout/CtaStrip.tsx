export function CtaStrip() {
  return (
    <div className="flex items-center justify-center gap-4 px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <span className="text-sm text-[var(--color-text-secondary)]">
        Want to automate this?
      </span>
      <code className="text-xs px-2 py-1 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] font-mono text-[var(--color-text-primary)]">
        npm i @pii-mask/core
      </code>
      <a
        href="https://pii-mask.dev/docs"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-muted)] transition-colors duration-150"
      >
        View docs ↗
      </a>
    </div>
  );
}
