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
    <div className="sticky top-0 z-40 flex flex-wrap items-center gap-3 px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <ModeSelector mode={mode} onModeChange={onModeChange} />
      <div className="h-5 w-px bg-[var(--color-border)]" />
      <DetectorFilter
        allDetectors={allDetectors}
        disabledDetectors={disabledDetectors}
        onToggle={onToggleDetector}
        onReset={onResetDetectors}
        activeCount={activeDetectorCount}
        totalCount={totalDetectorCount}
      />
      <div className="ml-auto flex items-center gap-2">
        <DownloadButton output={output} format={format} />
        {hasTokenMap && (
          <button
            onClick={onViewTokenMap}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-colors duration-150"
          >
            View Token Map
          </button>
        )}
        <ViewCodeButton onClick={onViewCode} />
      </div>
    </div>
  );
}
