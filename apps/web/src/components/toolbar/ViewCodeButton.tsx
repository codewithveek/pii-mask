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
      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
    >
      <Code size={14} />
      Code
    </button>
  );
}
