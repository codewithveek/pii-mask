import { useState, useRef, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { track } from '@vercel/analytics';

interface DetectorFilterProps {
  allDetectors: Array<{ id: string; label: string; category: string }>;
  disabledDetectors: string[];
  onToggle: (id: string) => void;
  onReset: () => void;
  activeCount: number;
  totalCount: number;
}

export function DetectorFilter({
  allDetectors,
  disabledDetectors,
  onToggle,
  onReset,
  activeCount,
  totalCount,
}: DetectorFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const grouped = allDetectors.reduce<Record<string, typeof allDetectors>>(
    (acc, d) => {
      const cat = d.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(d);
      return acc;
    },
    {},
  );

  const label =
    activeCount === totalCount
      ? 'All detectors'
      : `Detectors: ${activeCount} of ${totalCount}`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
      >
        <Filter size={12} />
        {label}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-72 max-h-80 overflow-y-auto rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--color-text-primary)]">
              Detectors
            </span>
            <button
              onClick={() => {
                onReset();
                track('detector_filter_changed', { count: totalCount });
              }}
              className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-muted)] transition-colors duration-150"
            >
              Reset
            </button>
          </div>
          {Object.entries(grouped).map(([category, detectors]) => (
            <div key={category} className="mb-2">
              <div className="text-xs uppercase tracking-wider text-[var(--color-text-disabled)] mb-1">
                {category}
              </div>
              {detectors.map((d) => (
                <label
                  key={d.id}
                  className="flex items-center gap-2 py-0.5 cursor-pointer text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <input
                    type="checkbox"
                    checked={!disabledDetectors.includes(d.id)}
                    onChange={() => {
                      onToggle(d.id);
                      track('detector_filter_changed', {
                        count: activeCount + (disabledDetectors.includes(d.id) ? 1 : -1),
                      });
                    }}
                    className="accent-[var(--color-accent)]"
                  />
                  {d.label}
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
