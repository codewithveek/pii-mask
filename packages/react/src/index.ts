// Guard runs before any exports are used
import { assertSafeReactVersion } from './guard.js';
assertSafeReactVersion();

export { MaskPII } from './MaskPII.js';
export type { MaskPIIProps } from './MaskPII.js';
export { usePIIMask } from './hooks/usePIIMask.js';
export type { UsePIIMaskOptions, UsePIIMaskReturn } from './hooks/usePIIMask.js';
export { usePIIMaskTable } from './hooks/usePIIMaskTable.js';
export type { UsePIIMaskTableOptions, UsePIIMaskTableReturn } from './hooks/usePIIMaskTable.js';
