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
    <div className="px-4 sm:px-6 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-[var(--color-detection)] font-medium flex-shrink-0">✦</span>
        {total === 0 ? (
          <span className="text-xs text-[var(--color-text-disabled)]">
            No PII detected
          </span>
        ) : (
          <>
            <span className="text-xs font-medium text-[var(--color-text-primary)] flex-shrink-0">
              {total} found
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto min-w-0">
              {entries.slice(0, 4).map(([id, count]) => (
                <span key={id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono bg-[var(--color-detection)]/8 text-[var(--color-detection)] whitespace-nowrap flex-shrink-0">
                  {id} <span className="text-[var(--color-text-disabled)]">×{count}</span>
                </span>
              ))}
              {entries.length > 4 && (
                <span className="text-[11px] text-[var(--color-text-disabled)] whitespace-nowrap flex-shrink-0">
                  +{entries.length - 4} more
                </span>
              )}
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-auto flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150 flex-shrink-0"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </>
        )}
      </div>
      {expanded && entries.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {entries.map(([id, count]) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-[var(--color-detection)]/8 text-[var(--color-detection)] border border-[var(--color-detection)]/15"
            >
              {id}
              <span className="text-[var(--color-text-disabled)]">×{count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
