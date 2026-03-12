import { Navigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Header } from '../components/layout/Header.js';
import { TokenMapTable } from '../components/tokenMap/TokenMapTable.js';

export function TokenMapPage() {
  const { state } = useLocation() as { state: { tokenMap?: Record<string, string> } | null };

  if (!state?.tokenMap) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150 mb-6"
          >
            <ArrowLeft size={14} />
            Back to tool
          </Link>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Token Map</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Map of reversible tokens to original PII values. Use this to restore originals after
            processing.
          </p>
          <TokenMapTable tokenMap={state.tokenMap} />
        </div>
      </div>
    </div>
  );
}
