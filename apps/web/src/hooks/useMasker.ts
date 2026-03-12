import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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

  const masker = useMemo(
    () =>
      createMasker({
        mode,
        ...(disabledDetectors.length > 0 && { disable: disabledDetectors }),
      }),
    [mode, disabledDetectors.join(',')],
  );

  const format = useMemo(() => detectFormat(input), [input]);

  const runTransform = useCallback(
    (value: string) => {
      if (!value.trim() || inputTooLarge) {
        setOutput('');
        setTokenMap({});
        setDetections([]);
        return;
      }

      const currentFormat = detectFormat(value);
      let result: MaskResult;

      try {
        if (currentFormat === 'object') {
          result = masker.maskObject(JSON.parse(value) as Record<string, unknown>);
          setOutput(JSON.stringify(JSON.parse(result.result) as unknown, null, 2));
        } else if (currentFormat === 'array') {
          result = masker.maskArray(JSON.parse(value) as unknown[]);
          setOutput(JSON.stringify(JSON.parse(result.result) as unknown, null, 2));
        } else {
          result = masker.maskString(value);
          setOutput(result.result);
        }
      } catch {
        result = masker.maskString(value);
        setOutput(result.result);
      }

      setTokenMap(result.tokenMap);
      setDetections(result.detections);
      setIsPending(false);
    },
    [masker, inputTooLarge],
  );

  // Debounced transform on input change
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
  }, [input, runTransform]);

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
