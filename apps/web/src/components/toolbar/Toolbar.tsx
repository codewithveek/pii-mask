import type { MaskMode } from '@pii-mask/core';
import type { InputFormat } from '../../lib/detectFormat.js';
import { ModeSelector } from './ModeSelector.js';
import { DetectorFilter } from './DetectorFilter.js';
import { DownloadButton } from './DownloadButton.js';
import { ViewCodeButton } from './ViewCodeButton.js';

interface ToolbarProps {
  mode: MaskMode;
  onModeChange: (mode: MaskMode) => void;
  output: string;
  format: InputFormat;
  tokenMap: Record<string, string>;
  onViewCode: () => void;
  onViewTokenMap: () => void;
  allDetectors: Array<{ id: string; label: string; category: string }>;
  disabledDetectors: string[];
  onToggleDetector: (id: string) => void;
  onResetDetectors: () => void;
  activeDetectorCount: number;
  totalDetectorCount: number;
}

export function Toolbar({
  mode,
  onModeChange,
  output,
  format,
  tokenMap,
  onViewCode,
  onViewTokenMap,
  allDetectors,
  disabledDetectors,
  onToggleDetector,
  onResetDetectors,
  activeDetectorCount,
  totalDetectorCount,
}: ToolbarProps) {
  const hasTokenMap = mode === 'tokenize' && Object.keys(tokenMap).length > 0;

  return (
    <div className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 sm:px-6 py-2.5">
        <div className="flex items-center flex-wrap gap-2">
          <ModeSelector mode={mode} onModeChange={onModeChange} />
          <div className="hidden sm:block h-5 w-px bg-[var(--color-border)] flex-shrink-0" />
          <DetectorFilter
            allDetectors={allDetectors}
            disabledDetectors={disabledDetectors}
            onToggle={onToggleDetector}
            onReset={onResetDetectors}
            activeCount={activeDetectorCount}
            totalCount={totalDetectorCount}
          />
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <DownloadButton output={output} format={format} />
          {hasTokenMap && (
            <button
              onClick={onViewTokenMap}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-colors duration-150"
            >
              Token Map
            </button>
          )}
          <ViewCodeButton onClick={onViewCode} />
        </div>
      </div>
    </div>
  );
}
