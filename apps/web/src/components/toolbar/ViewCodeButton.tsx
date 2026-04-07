import { Code } from 'lucide-react';
import { track } from '@vercel/analytics';

interface ViewCodeButtonProps {
  onClick: () => void;
}

export function ViewCodeButton({ onClick }: ViewCodeButtonProps) {
  return (
    <button
      onClick={() => {
        onClick();
        track('view_code_opened');
      }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors duration-150"
    >
      <Code size={13} />
      Code
    </button>
  );
}
