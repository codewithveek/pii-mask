// Guard runs before any exports are used
import { assertSafeReactVersion } from './guard';
assertSafeReactVersion();

export { MaskPII } from './MaskPII';
export type { MaskPIIProps } from './MaskPII';
export { usePIIMask } from './hooks/usePIIMask';
export type { UsePIIMaskOptions, UsePIIMaskReturn } from './hooks/usePIIMask';
export { usePIIMaskTable } from './hooks/usePIIMaskTable';
export type { UsePIIMaskTableOptions, UsePIIMaskTableReturn } from './hooks/usePIIMaskTable';
