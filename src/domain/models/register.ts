/**
 * Daily stock register — models the physical bar register sheet:
 * each liquor item has quantities in six bottle sizes across ledger groups
 * (opening, received, total, balance, sale, amount).
 *
 * Business rules:
 *   total   = opening + received        (computed)
 *   balance = total − sale              (computed, clamped ≥ 0)
 *   amount  = sale value in ₹           (entered per row)
 *
 * Opening, Received and Sale are the numbers entered/scanned; Total and
 * Balance are always derived (fewer cells to read = faster, more accurate
 * scans, and no arithmetic mistakes).
 */

/** Standard Indian excise bottle sizes, in ml — the sheet's column order. */
export const BOTTLE_SIZES = [1000, 750, 180, 90, 60, 30] as const;
export type BottleSize = (typeof BOTTLE_SIZES)[number];

export type SizeQuantities = Readonly<Record<BottleSize, number>>;

/** Ledger groups the user edits directly; total & balance are derived. */
export type EditableStockField = 'opening' | 'received' | 'sale';

export function createSizeQuantities(): SizeQuantities {
  return { 1000: 0, 750: 0, 180: 0, 90: 0, 60: 0, 30: 0 };
}

export function addSizes(a: SizeQuantities, b: SizeQuantities): SizeQuantities {
  const out = createSizeQuantities() as Record<BottleSize, number>;
  for (const size of BOTTLE_SIZES) {
    out[size] = a[size] + b[size];
  }
  return out;
}

/** a − b per size, clamped at zero (a miscounted balance must not go negative). */
export function subtractSizesClamped(a: SizeQuantities, b: SizeQuantities): SizeQuantities {
  const out = createSizeQuantities() as Record<BottleSize, number>;
  for (const size of BOTTLE_SIZES) {
    out[size] = Math.max(0, a[size] - b[size]);
  }
  return out;
}

export function sumUnits(q: SizeQuantities): number {
  return BOTTLE_SIZES.reduce((sum, size) => sum + q[size], 0);
}

export function hasAnyUnits(q: SizeQuantities): boolean {
  return BOTTLE_SIZES.some((size) => q[size] > 0);
}

export interface StockRegisterRow {
  readonly itemId: string;
  readonly opening: SizeQuantities;
  readonly received: SizeQuantities;
  readonly sale: SizeQuantities;
  /** Sale value in rupees, entered per row as on the sheet. */
  readonly amountRs: number;
}

export interface StockRegister {
  readonly id: string;
  /** ISO date (yyyy-mm-dd) the register covers. */
  readonly date: string;
  readonly barName: string;
  readonly status: 'draft' | 'completed';
  readonly createdAt: number;
  readonly completedAt: number | null;
  readonly rows: readonly StockRegisterRow[];
}

/** total = opening + received */
export function rowTotal(row: Pick<StockRegisterRow, 'opening' | 'received'>): SizeQuantities {
  return addSizes(row.opening, row.received);
}

/** balance = total − sale, clamped ≥ 0 */
export function rowBalance(
  row: Pick<StockRegisterRow, 'opening' | 'received' | 'sale'>,
): SizeQuantities {
  return subtractSizesClamped(rowTotal(row), row.sale);
}

export interface RegisterSummary {
  readonly rowCount: number;
  readonly saleUnits: number;
  readonly totalAmountRs: number;
}

export function summarizeRegister(register: StockRegister): RegisterSummary {
  let saleUnits = 0;
  let totalAmountRs = 0;
  for (const row of register.rows) {
    saleUnits += sumUnits(row.sale);
    totalAmountRs += row.amountRs;
  }
  return { rowCount: register.rows.length, saleUnits, totalAmountRs };
}
