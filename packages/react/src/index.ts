// Warns (once, never throws) on React releases with known RSC advisories
import { warnIfVulnerableReact } from './guard';
warnIfVulnerableReact();

export { MaskPII } from './MaskPII';
export type { MaskPIIProps } from './MaskPII';
export { usePIIMask } from './hooks/usePIIMask';
export type { UsePIIMaskOptions, UsePIIMaskReturn } from './hooks/usePIIMask';
export { usePIIMaskTable } from './hooks/usePIIMaskTable';
export type { UsePIIMaskTableOptions, UsePIIMaskTableReturn } from './hooks/usePIIMaskTable';
