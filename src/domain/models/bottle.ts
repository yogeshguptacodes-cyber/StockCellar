/**
 * Catalog entities — pure domain, no framework imports.
 */
export interface Category {
  readonly id: string;
  readonly name: string;
}

export interface Bottle {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  readonly categoryId: string;
  readonly sizeMl: number;
}

/** Human-readable bottle size: 750 → "750 ml", 1000 → "1 L". */
export function formatBottleSize(sizeMl: number): string {
  if (sizeMl >= 1000 && sizeMl % 250 === 0) {
    const liters = sizeMl / 1000;
    return `${Number.isInteger(liters) ? liters : liters.toFixed(2)} L`;
  }
  return `${sizeMl} ml`;
}
