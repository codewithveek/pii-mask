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
  /**
   * @deprecated Has no effect: masking is synchronous, so there is no
   * loading state to show.
   */
  fallback?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders `children` with PII masked.
 *
 * Masking happens in the browser, so the raw value has already been sent to
 * the client and is visible in props, devtools and network responses. Use this
 * for display only; mask on the server when the viewer must never see the value.
 * `reveal` is a UI convenience, not an access control.
 */
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
