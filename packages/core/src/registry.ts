import type { PIIDetector, MaskOptions } from './types';

class DetectorRegistry {
  private detectors = new Map<string, PIIDetector>();

  register(detector: PIIDetector, options: { override?: boolean } = {}): void {
    if (this.detectors.has(detector.id)) {
      if (options.override) {
        this.detectors.set(detector.id, detector);
        return;
      }
      // Accidental double-registration — warn loudly, then replace
      console.warn(
        `[pii-mask] Detector "${detector.id}" was already registered. ` +
          `The previous registration has been replaced. ` +
          `Pass { override: true } to silence this warning.`,
      );
    }
    this.detectors.set(detector.id, detector);
  }

  registerAll(detectors: PIIDetector[]): void {
    detectors.forEach((d) => this.register(d));
  }

  resolve(options: Pick<MaskOptions, 'disable' | 'only' | 'extend' | 'regions'>): PIIDetector[] {
    const extended = new Map(this.detectors);

    // Consumer extensions use silent replacement — intentional override by ID
    options.extend?.forEach((d) => {
      extended.set(d.id, d);
    });

    let resolved = [...extended.values()];

    if (options.only?.length) {
      resolved = resolved.filter(
        (d) => options.only!.includes(d.id) || options.only!.includes(d.category),
      );
    }

    if (options.regions?.length) {
      resolved = resolved.filter(
        (d) => !d.regions || d.regions.some((r) => options.regions!.includes(r)),
      );
    }

    if (options.disable?.length) {
      resolved = resolved.filter((d) => !options.disable!.includes(d.id));
    }

    return resolved;
  }

  list(): PIIDetector[] {
    return [...this.detectors.values()];
  }
}

// Singleton registry — all built-in detectors self-register on import
export const registry = new DetectorRegistry();
