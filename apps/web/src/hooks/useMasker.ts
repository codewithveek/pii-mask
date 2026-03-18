import { useState, useMemo, useEffect, useRef } from 'react';
import { createMasker } from '@pii-mask/core';
import type { MaskMode, MaskResult } from '@pii-mask/core';
import { detectFormat, type InputFormat } from '../lib/detectFormat.js';

const MAX_INPUT_SIZE = 500 * 1024; // 500KB

interface UseMaskerOptions {
  mode: MaskMode;
  disabledDetectors: string[];
}

interface UseMaskerReturn {
  input: string;
  setInput: (value: string) => void;
  output: string;
  format: InputFormat;
  tokenMap: Record<string, string>;
  detections: string[];
  isPending: boolean;
  inputTooLarge: boolean;
}

export function useMasker({ mode, disabledDetectors }: UseMaskerOptions): UseMaskerReturn {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [tokenMap, setTokenMap] = useState<Record<string, string>>({});
  const [detections, setDetections] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const inputTooLarge = new TextEncoder().encode(input).byteLength > MAX_INPUT_SIZE;

  // Stable string key so useMemo only re-runs when detector list *content* changes
  const detectorsKey = disabledDetectors.join(',');
  const masker = useMemo(
    () =>
      createMasker({
        mode,
        ...(detectorsKey ? { disable: detectorsKey.split(',') } : {}),
      }),
    [mode, detectorsKey],
  );

  const format = useMemo(() => detectFormat(input), [input]);

  // Keep a ref to always-current masker + inputTooLarge to avoid stale closures
  const maskerRef = useRef(masker);
  maskerRef.current = masker;
  const inputTooLargeRef = useRef(inputTooLarge);
  inputTooLargeRef.current = inputTooLarge;

  function runTransform(value: string) {
    if (!value.trim() || inputTooLargeRef.current) {
      setOutput('');
      setTokenMap({});
      setDetections([]);
      return;
    }

    const currentFormat = detectFormat(value);
    const m = maskerRef.current;
    let result: MaskResult;

    try {
      if (currentFormat === 'object') {
        result = m.maskObject(JSON.parse(value) as Record<string, unknown>);
        setOutput(JSON.stringify(JSON.parse(result.result) as unknown, null, 2));
      } else if (currentFormat === 'array') {
        result = m.maskArray(JSON.parse(value) as unknown[]);
        setOutput(JSON.stringify(JSON.parse(result.result) as unknown, null, 2));
      } else {
        result = m.maskString(value);
        setOutput(result.result);
      }
    } catch {
      result = m.maskString(value);
      setOutput(result.result);
    }

    setTokenMap(result.tokenMap);
    setDetections(result.detections);
    setIsPending(false);
  }

  // Debounced transform on input change only
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setTokenMap({});
      setDetections([]);
      setIsPending(false);
      return;
    }

    setIsPending(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runTransform(input), 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  // Immediate re-run on mode/detector change (no debounce)
  useEffect(() => {
    if (input.trim()) {
      runTransform(input);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masker]);

  return {
    input,
    setInput,
    output,
    format,
    tokenMap,
    detections,
    isPending,
    inputTooLarge,
  };
}
