import { useState, useCallback } from 'react';
import { registry } from '@pii-mask/core';

interface UseDetectorFilterReturn {
  allDetectors: Array<{ id: string; label: string; category: string }>;
  disabledDetectors: string[];
  toggleDetector: (id: string) => void;
  resetFilter: () => void;
  activeCount: number;
  totalCount: number;
}

export function useDetectorFilter(): UseDetectorFilterReturn {
  const allDetectors = registry.list().map((d) => ({
    id: d.id,
    label: d.label,
    category: d.category,
  }));

  const [disabledDetectors, setDisabledDetectors] = useState<string[]>([]);

  const toggleDetector = useCallback((id: string) => {
    setDisabledDetectors((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }, []);

  const resetFilter = useCallback(() => {
    setDisabledDetectors([]);
  }, []);

  return {
    allDetectors,
    disabledDetectors,
    toggleDetector,
    resetFilter,
    activeCount: allDetectors.length - disabledDetectors.length,
    totalCount: allDetectors.length,
  };
}
