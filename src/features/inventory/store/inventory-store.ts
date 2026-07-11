import { create } from 'zustand';

import { container } from '@/core/di/container';
import { normalizeError } from '@/core/errors';
import { createLogger } from '@/core/logger';
import type { Bottle, Category, InventoryEntry, InventorySession, SessionSource } from '@/domain/models';
import { createId } from '@/shared/utils/id';

const log = createLogger('inventory:store');

/** One undo step — a batch of previous quantities (single edits are a batch of 1). */
type UndoBatch = readonly { bottleId: string; previousQuantity: number }[];

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface InventoryState {
  status: LoadStatus;
  catalog: readonly Bottle[];
  categories: readonly Category[];
  /** Draft counts, bottleId → quantity. */
  quantities: Readonly<Record<string, number>>;
  /** Rows modified during this session (for highlighting). */
  touched: Readonly<Record<string, true>>;
  undoStack: readonly UndoBatch[];
  sessionStartedAt: number | null;
  saving: boolean;

  initialize: () => Promise<void>;
  setQuantity: (bottleId: string, quantity: number) => void;
  adjustQuantity: (bottleId: string, delta: number) => void;
  applyExtraction: (entries: readonly { bottleId: string; quantity: number }[]) => void;
  undo: () => void;
  resetAll: () => void;
  completeSession: (source: SessionSource) => Promise<InventorySession | null>;
}

const MAX_QUANTITY = 9999;
const MAX_UNDO_STEPS = 50;

function clampQuantity(value: number): number {
  return Math.max(0, Math.min(MAX_QUANTITY, Math.trunc(value)));
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  status: 'idle',
  catalog: [],
  categories: [],
  quantities: {},
  touched: {},
  undoStack: [],
  sessionStartedAt: null,
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

  setQuantity: (bottleId, rawQuantity) => {
    const quantity = clampQuantity(rawQuantity);
    const { quantities, touched, undoStack, sessionStartedAt } = get();
    const previous = quantities[bottleId] ?? 0;
    if (previous === quantity) {
      return;
    }
    set({
      quantities: { ...quantities, [bottleId]: quantity },
      touched: { ...touched, [bottleId]: true },
      undoStack: [...undoStack.slice(-(MAX_UNDO_STEPS - 1)), [{ bottleId, previousQuantity: previous }]],
      sessionStartedAt: sessionStartedAt ?? Date.now(),
    });
    container.analytics.track({
      name: 'bottle_quantity_updated',
      payload: { bottleId, quantity },
    });
  },

  adjustQuantity: (bottleId, delta) => {
    const current = get().quantities[bottleId] ?? 0;
    get().setQuantity(bottleId, current + delta);
  },

  applyExtraction: (entries) => {
    const { quantities, touched, undoStack } = get();
    const batch = entries.map((entry) => ({
      bottleId: entry.bottleId,
      previousQuantity: quantities[entry.bottleId] ?? 0,
    }));
    const nextQuantities = { ...quantities };
    const nextTouched: Record<string, true> = { ...touched };
    for (const entry of entries) {
      nextQuantities[entry.bottleId] = clampQuantity(entry.quantity);
      nextTouched[entry.bottleId] = true;
    }
    set({
      quantities: nextQuantities,
      touched: nextTouched,
      undoStack: [...undoStack.slice(-(MAX_UNDO_STEPS - 1)), batch],
      sessionStartedAt: get().sessionStartedAt ?? Date.now(),
    });
    container.analytics.track({ name: 'scan_applied', payload: { skuCount: entries.length } });
  },

  undo: () => {
    const { undoStack, quantities } = get();
    const lastBatch = undoStack[undoStack.length - 1];
    if (!lastBatch) {
      return;
    }
    const nextQuantities = { ...quantities };
    for (const { bottleId, previousQuantity } of lastBatch) {
      nextQuantities[bottleId] = previousQuantity;
    }
    set({ quantities: nextQuantities, undoStack: undoStack.slice(0, -1) });
  },

  resetAll: () => {
    const { quantities, undoStack } = get();
    const cleared = Object.entries(quantities).filter(([, quantity]) => quantity > 0);
    if (cleared.length === 0) {
      return;
    }
    const batch = cleared.map(([bottleId, previousQuantity]) => ({ bottleId, previousQuantity }));
    set({
      quantities: {},
      undoStack: [...undoStack.slice(-(MAX_UNDO_STEPS - 1)), batch],
    });
    container.analytics.track({ name: 'inventory_reset', payload: { skusCleared: cleared.length } });
  },

  completeSession: async (source) => {
    const { quantities, sessionStartedAt } = get();
    const now = Date.now();
    const entries: InventoryEntry[] = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([bottleId, quantity]) => ({ bottleId, quantity, updatedAt: now }));
    if (entries.length === 0) {
      return null;
    }

    set({ saving: true });
    try {
      const session: InventorySession = {
        id: createId('session'),
        status: 'completed',
        source,
        startedAt: sessionStartedAt ?? now,
        completedAt: now,
        entries,
      };
      await container.inventoryRepository.saveSession(session);
      const totalUnits = entries.reduce((sum, entry) => sum + entry.quantity, 0);
      container.analytics.track({
        name: 'inventory_saved',
        payload: { sessionId: session.id, totalSkus: entries.length, totalUnits },
      });
      set({ quantities: {}, touched: {}, undoStack: [], sessionStartedAt: null, saving: false });
      return session;
    } catch (error) {
      const normalized = normalizeError(error);
      log.error('Failed to save session', normalized);
      container.analytics.track({
        name: 'error_occurred',
        payload: { code: normalized.code, message: normalized.message },
      });
      set({ saving: false });
      throw normalized;
    }
  },
}));
