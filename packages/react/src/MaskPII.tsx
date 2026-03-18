import React, { useMemo } from 'react';
import { createMasker } from '@pii-mask/core';
import type { MaskMode } from '@pii-mask/core';

export interface MaskPIIProps {
  children: string;
  /** Detector IDs or category names to run. Default: all detectors. */
  detect?: string[];
  mode?: MaskMode;
  /** When true, renders the original unmasked value. Use for role-gated UIs. */
  reveal?: boolean;
  /** Rendered while masking. Default: '···' */
  fallback?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MaskPII({
  children,
  detect,
  mode = 'mask',
  reveal = false,
  className,
  style,
}: MaskPIIProps) {
  const detectKey = detect?.join(',') ?? '';
  const masker = useMemo(
    () => createMasker({ mode, ...(detectKey ? { only: detectKey.split(',') } : {}) }),
    [mode, detectKey],
  );

  const masked = useMemo(() => masker.maskString(children).result, [masker, children]);

  return (
    <span className={className} style={style} data-pii-masked={!reveal}>
      {reveal ? children : masked}
    </span>
  );
}
