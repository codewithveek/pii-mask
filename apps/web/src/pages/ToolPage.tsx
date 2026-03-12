import { useState } from 'react';
import type { MaskMode } from '@pii-mask/core';
import { useMasker } from '../hooks/useMasker.js';
import { useDetectorFilter } from '../hooks/useDetectorFilter.js';
import { useTokenMap } from '../hooks/useTokenMap.js';
import { Header } from '../components/layout/Header.js';
import { CtaStrip } from '../components/layout/CtaStrip.js';
import { Toolbar } from '../components/toolbar/Toolbar.js';
import { InputPanel } from '../components/panels/InputPanel.js';
import { OutputPanel } from '../components/panels/OutputPanel.js';
import { DetectionReport } from '../components/report/DetectionReport.js';
import { CodeSlideOver } from '../components/slideOver/CodeSlideOver.js';

export function ToolPage() {
  const [mode, setMode] = useState<MaskMode>('mask');
  const [codeSlideOpen, setCodeSlideOpen] = useState(false);

  const { allDetectors, disabledDetectors, toggleDetector, resetFilter, activeCount, totalCount } =
    useDetectorFilter();

  const { input, setInput, output, format, tokenMap, detections, isPending, inputTooLarge } =
    useMasker({ mode, disabledDetectors });

  const { navigateToTokenMap } = useTokenMap();

  return (
    <div className="flex flex-col h-full">
      <Header />
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        output={output}
        format={format}
        tokenMap={tokenMap}
        onViewCode={() => setCodeSlideOpen(true)}
        onViewTokenMap={() => navigateToTokenMap(tokenMap)}
        allDetectors={allDetectors}
        disabledDetectors={disabledDetectors}
        onToggleDetector={toggleDetector}
        onResetDetectors={resetFilter}
        activeDetectorCount={activeCount}
        totalDetectorCount={totalCount}
      />
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-0">
        <div className="min-h-0 p-3">
          <InputPanel value={input} onChange={setInput} inputTooLarge={inputTooLarge} />
        </div>
        <div className="min-h-0 p-3">
          <OutputPanel output={output} isPending={isPending} />
        </div>
      </div>
      <DetectionReport detections={detections} />
      <CtaStrip />
      <CodeSlideOver
        open={codeSlideOpen}
        onClose={() => setCodeSlideOpen(false)}
        mode={mode}
        format={format}
        disabledDetectors={disabledDetectors}
      />
    </div>
  );
}
