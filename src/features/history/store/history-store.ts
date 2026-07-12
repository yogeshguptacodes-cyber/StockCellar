import { create } from 'zustand';

import { container } from '@/core/di/container';
import { normalizeError } from '@/core/errors';
import { createLogger } from '@/core/logger';
import type { StockRegister } from '@/domain/models';

const log = createLogger('history:store');

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface HistoryState {
  status: LoadStatus;
  registers: readonly StockRegister[];
  load: () => Promise<void>;
  remove: (registerId: string) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  status: 'idle',
  registers: [],

  load: async () => {
    if (get().status === 'loading') {
      return;
    }
    set((state) => ({ status: state.status === 'ready' ? 'ready' : 'loading' }));
    try {
      const registers = await container.inventoryRepository.listRegisters();
      set({ registers, status: 'ready' });
    } catch (error) {
      log.error('Failed to load registers', normalizeError(error));
      set({ status: 'error' });
    }
  },

  remove: async (registerId) => {
    await container.inventoryRepository.deleteRegister(registerId);
    container.analytics.track({ name: 'register_deleted', payload: { registerId } });
    set((state) => ({ registers: state.registers.filter((r) => r.id !== registerId) }));
  },
}));
