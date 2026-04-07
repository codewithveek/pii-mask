export function CtaStrip() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 px-4 sm:px-6 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <span className="text-xs text-[var(--color-text-secondary)]">
        Automate this in your pipeline:
      </span>
      <code className="text-xs px-2 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] font-mono text-[var(--color-text-primary)]">
        npm i @pii-mask/core
      </code>
      <a
        href="https://pii-mask.dev/docs"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-muted)] transition-colors duration-150"
      >
        View docs
      </a>
    </div>
  );
}
