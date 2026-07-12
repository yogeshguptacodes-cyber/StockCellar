import { create } from 'zustand';

import { container } from '@/core/di/container';
import { normalizeError } from '@/core/errors';
import { createLogger } from '@/core/logger';
import {
  BOTTLE_SIZES,
  createSizeQuantities,
  hasAnyUnits,
  summarizeRegister,
  type BottleSize,
  type Category,
  type EditableStockField,
  type LiquorItem,
  type SizeQuantities,
  type StockRegister,
  type StockRegisterRow,
} from '@/domain/models';
import { matchItemByName } from '@/features/inventory/utils/match-items';
import type { ExtractedRegisterRow, ExtractedSizes } from '@/services/extraction/inventory-extraction-service';
import { createId } from '@/shared/utils/id';
import { toIsoDate } from '@/shared/utils/format-date';

const log = createLogger('inventory:register-store');

/** Bar identity — becomes a Settings field when multi-counter support lands. */
export const DEFAULT_BAR_NAME = 'PS-3';

const MAX_CELL_QUANTITY = 9999;
const MAX_AMOUNT_RS = 10_000_000;
const MAX_UNDO_STEPS = 50;

/** One item's editable ledger values in the current draft. */
export interface DraftRow {
  readonly opening: SizeQuantities;
  readonly received: SizeQuantities;
  readonly sale: SizeQuantities;
  readonly amountRs: number;
}

export function emptyDraftRow(): DraftRow {
  return {
    opening: createSizeQuantities(),
    received: createSizeQuantities(),
    sale: createSizeQuantities(),
    amountRs: 0,
  };
}

/** One undoable cell change; a batch is one user action. */
interface UndoCell {
  readonly itemId: string;
  readonly field: EditableStockField | 'amount';
  readonly size: BottleSize | null;
  readonly previous: number;
}

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface RegisterState {
  status: LoadStatus;
  catalog: readonly LiquorItem[];
  categories: readonly Category[];
  rows: Readonly<Record<string, DraftRow>>;
  touched: Readonly<Record<string, true>>;
  undoStack: readonly (readonly UndoCell[])[];
  startedAt: number | null;
  saving: boolean;

  initialize: () => Promise<void>;
  setCell: (itemId: string, field: EditableStockField, size: BottleSize, quantity: number) => void;
  setAmount: (itemId: string, amountRs: number) => void;
  applyExtraction: (rows: readonly ExtractedRegisterRow[]) => { matched: number; unmatched: number };
  undo: () => void;
  resetAll: () => void;
  saveRegister: () => Promise<StockRegister | null>;
}

function clampCell(value: number): number {
  return Math.max(0, Math.min(MAX_CELL_QUANTITY, Math.trunc(value)));
}

function sizesFromExtracted(extracted: ExtractedSizes | undefined): SizeQuantities {
  const out = createSizeQuantities() as Record<BottleSize, number>;
  for (const size of BOTTLE_SIZES) {
    const raw = extracted?.[String(size)];
    out[size] = typeof raw === 'number' ? clampCell(raw) : 0;
  }
  return out;
}

function rowHasActivity(row: DraftRow): boolean {
  return (
    hasAnyUnits(row.opening) ||
    hasAnyUnits(row.received) ||
    hasAnyUnits(row.sale) ||
    row.amountRs > 0
  );
}

function pushBatch(
  stack: readonly (readonly UndoCell[])[],
  batch: readonly UndoCell[],
): readonly (readonly UndoCell[])[] {
  return [...stack.slice(-(MAX_UNDO_STEPS - 1)), batch];
}

export const useRegisterStore = create<RegisterState>()((set, get) => ({
  status: 'idle',
  catalog: [],
  categories: [],
  rows: {},
  touched: {},
  undoStack: [],
  startedAt: null,
  saving: false,

  initialize: async () => {
    if (get().status === 'ready' || get().status === 'loading') {
      return;
    }
    set({ status: 'loading' });
    try {
      const [catalog, categories] = await Promise.all([
        container.inventoryRepository.getCatalog(),
        container.inventoryRepository.getCategories(),
      ]);
      set({ catalog, categories, status: 'ready' });
    } catch (error) {
      log.error('Failed to load catalog', error);
      set({ status: 'error' });
    }
  },

  setCell: (itemId, field, size, rawQuantity) => {
    const quantity = clampCell(rawQuantity);
    const { rows, touched, undoStack, startedAt } = get();
    const row = rows[itemId] ?? emptyDraftRow();
    const previous = row[field][size];
    if (previous === quantity) {
      return;
    }
    set({
      rows: { ...rows, [itemId]: { ...row, [field]: { ...row[field], [size]: quantity } } },
      touched: { ...touched, [itemId]: true },
      undoStack: pushBatch(undoStack, [{ itemId, field, size, previous }]),
      startedAt: startedAt ?? Date.now(),
    });
    container.analytics.track({
      name: 'register_cell_updated',
      payload: { itemId, field, size, quantity },
    });
  },

  setAmount: (itemId, rawAmount) => {
    const amountRs = Math.max(0, Math.min(MAX_AMOUNT_RS, Math.trunc(rawAmount)));
    const { rows, touched, undoStack, startedAt } = get();
    const row = rows[itemId] ?? emptyDraftRow();
    if (row.amountRs === amountRs) {
      return;
    }
    set({
      rows: { ...rows, [itemId]: { ...row, amountRs } },
      touched: { ...touched, [itemId]: true },
      undoStack: pushBatch(undoStack, [
        { itemId, field: 'amount', size: null, previous: row.amountRs },
      ]),
      startedAt: startedAt ?? Date.now(),
    });
    container.analytics.track({ name: 'register_amount_updated', payload: { itemId, amountRs } });
  },

  applyExtraction: (extractedRows) => {
    const { rows, touched, undoStack, catalog, startedAt } = get();
    const nextRows: Record<string, DraftRow> = { ...rows };
    const nextTouched: Record<string, true> = { ...touched };
    const batch: UndoCell[] = [];
    let matched = 0;
    let unmatched = 0;

    for (const extracted of extractedRows) {
      const item = matchItemByName(extracted.itemName, catalog);
      if (!item) {
        unmatched += 1;
        log.warn('Extracted row did not match any catalog item', { name: extracted.itemName });
        continue;
      }
      matched += 1;
      const current = nextRows[item.id] ?? emptyDraftRow();

      const fields: readonly EditableStockField[] = ['opening', 'received', 'sale'];
      const updates: Partial<Record<EditableStockField, SizeQuantities>> = {};
      for (const field of fields) {
        const extractedSizes = extracted[field];
        if (!extractedSizes) {
          continue;
        }
        const next = sizesFromExtracted(extractedSizes);
        for (const size of BOTTLE_SIZES) {
          if (current[field][size] !== next[size]) {
            batch.push({ itemId: item.id, field, size, previous: current[field][size] });
          }
        }
        updates[field] = next;
      }

      let amountRs = current.amountRs;
      if (typeof extracted.amountRs === 'number' && extracted.amountRs !== current.amountRs) {
        batch.push({ itemId: item.id, field: 'amount', size: null, previous: current.amountRs });
        amountRs = Math.max(0, Math.min(MAX_AMOUNT_RS, Math.trunc(extracted.amountRs)));
      }

      nextRows[item.id] = { ...current, ...updates, amountRs };
      nextTouched[item.id] = true;
    }

    if (batch.length > 0) {
      set({
        rows: nextRows,
        touched: nextTouched,
        undoStack: pushBatch(undoStack, batch),
        startedAt: startedAt ?? Date.now(),
      });
    }
    container.analytics.track({ name: 'scan_applied', payload: { matched, unmatched } });
    return { matched, unmatched };
  },

  undo: () => {
    const { undoStack, rows } = get();
    const lastBatch = undoStack[undoStack.length - 1];
    if (!lastBatch) {
      return;
    }
    const nextRows: Record<string, DraftRow> = { ...rows };
    // Restore in reverse so multi-edits to the same cell unwind correctly.
    for (let i = lastBatch.length - 1; i >= 0; i -= 1) {
      const cell = lastBatch[i];
      if (!cell) {
        continue;
      }
      const row = nextRows[cell.itemId] ?? emptyDraftRow();
      nextRows[cell.itemId] =
        cell.field === 'amount' || cell.size === null
          ? { ...row, amountRs: cell.previous }
          : { ...row, [cell.field]: { ...row[cell.field], [cell.size]: cell.previous } };
    }
    set({ rows: nextRows, undoStack: undoStack.slice(0, -1) });
  },

  resetAll: () => {
    const { rows, undoStack } = get();
    const batch: UndoCell[] = [];
    for (const [itemId, row] of Object.entries(rows)) {
      for (const field of ['opening', 'received', 'sale'] as const) {
        for (const size of BOTTLE_SIZES) {
          if (row[field][size] !== 0) {
            batch.push({ itemId, field, size, previous: row[field][size] });
          }
        }
      }
      if (row.amountRs !== 0) {
        batch.push({ itemId, field: 'amount', size: null, previous: row.amountRs });
      }
    }
    if (batch.length === 0) {
      return;
    }
    set({ rows: {}, undoStack: pushBatch(undoStack, batch) });
    container.analytics.track({
      name: 'inventory_reset',
      payload: { rowsCleared: Object.keys(rows).length },
    });
  },

  saveRegister: async () => {
    const { rows, startedAt } = get();
    const now = Date.now();
    const registerRows: StockRegisterRow[] = Object.entries(rows)
      .filter(([, row]) => rowHasActivity(row))
      .map(([itemId, row]) => ({
        itemId,
        opening: row.opening,
        received: row.received,
        sale: row.sale,
        amountRs: row.amountRs,
      }));
    if (registerRows.length === 0) {
      return null;
    }

    set({ saving: true });
    try {
      const register: StockRegister = {
        id: createId('register'),
        date: toIsoDate(new Date()),
        barName: DEFAULT_BAR_NAME,
        status: 'completed',
        createdAt: startedAt ?? now,
        completedAt: now,
        rows: registerRows,
      };
      await container.inventoryRepository.saveRegister(register);
      const summary = summarizeRegister(register);
      container.analytics.track({
        name: 'inventory_saved',
        payload: {
          registerId: register.id,
          rowCount: summary.rowCount,
          saleUnits: summary.saleUnits,
          amountRs: summary.totalAmountRs,
        },
      });
      set({ rows: {}, touched: {}, undoStack: [], startedAt: null, saving: false });
      return register;
    } catch (error) {
      const normalized = normalizeError(error);
      log.error('Failed to save register', normalized);
      container.analytics.track({
        name: 'error_occurred',
        payload: { code: normalized.code, message: normalized.message },
      });
      set({ saving: false });
      throw normalized;
    }
  },
}));
