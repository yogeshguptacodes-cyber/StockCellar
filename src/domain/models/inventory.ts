import type { Bottle } from './bottle';

/**
 * Inventory entities and domain rules — pure TypeScript.
 */
export type SessionStatus = 'draft' | 'completed';
export type SessionSource = 'manual' | 'scan';

export interface InventoryEntry {
  readonly bottleId: string;
  readonly quantity: number;
  /** Epoch ms of the last edit to this entry. */
  readonly updatedAt: number;
}

export interface InventorySession {
  readonly id: string;
  readonly status: SessionStatus;
  readonly source: SessionSource;
  /** Epoch ms. */
  readonly startedAt: number;
  readonly completedAt: number | null;
  readonly entries: readonly InventoryEntry[];
}

export interface InventorySummary {
  readonly totalSkus: number;
  readonly totalUnits: number;
  /** Units counted per category id. */
  readonly unitsByCategory: Readonly<Record<string, number>>;
}

/** Aggregate a session into display/report totals. */
export function summarizeSession(
  session: InventorySession,
  bottleById: ReadonlyMap<string, Bottle>,
): InventorySummary {
  let totalUnits = 0;
  const unitsByCategory: Record<string, number> = {};

  for (const entry of session.entries) {
    totalUnits += entry.quantity;
    const bottle = bottleById.get(entry.bottleId);
    if (bottle) {
      unitsByCategory[bottle.categoryId] =
        (unitsByCategory[bottle.categoryId] ?? 0) + entry.quantity;
    }
  }

  return { totalSkus: session.entries.length, totalUnits, unitsByCategory };
}
