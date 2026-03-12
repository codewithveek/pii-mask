import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DetectionReportProps {
  detections: string[];
}

export function DetectionReport({ detections }: DetectionReportProps) {
  const [expanded, setExpanded] = useState(false);

  // Count occurrences of each detector ID
  const counts = detections.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  const total = detections.length;
  const entries = Object.entries(counts);

  return (
    <div className="px-6 py-2 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--color-detection)] font-medium">✦</span>
        {total === 0 ? (
          <span className="text-xs text-[var(--color-text-disabled)]">
            No PII detected in current input
          </span>
        ) : (
          <>
            <span className="text-xs text-[var(--color-text-primary)]">
              {total} instance{total !== 1 ? 's' : ''} detected
            </span>
            <div className="flex items-center gap-2">
              {entries.slice(0, 5).map(([id, count]) => (
                <span key={id} className="text-[10px] text-[var(--color-text-secondary)] font-mono">
                  {id} × {count}
                </span>
              ))}
              {entries.length > 5 && (
                <span className="text-[10px] text-[var(--color-text-disabled)]">
                  +{entries.length - 5} more
                </span>
              )}
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-auto flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
            >
              Details
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </>
        )}
      </div>
      {expanded && entries.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {entries.map(([id, count]) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--color-detection)]/10 text-[var(--color-detection)] border border-[var(--color-detection)]/20"
            >
              {id}
              <span className="text-[var(--color-text-disabled)]">× {count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
