import { create } from 'zustand';

import { container } from '@/core/di/container';
import { normalizeError } from '@/core/errors';
import { createLogger } from '@/core/logger';
import type { InventorySession } from '@/domain/models';

const log = createLogger('history:store');

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface HistoryState {
  status: LoadStatus;
  sessions: readonly InventorySession[];
  load: () => Promise<void>;
  remove: (sessionId: string) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  status: 'idle',
  sessions: [],

  load: async () => {
    if (get().status === 'loading') {
      return;
    }
    set((state) => ({ status: state.status === 'ready' ? 'ready' : 'loading' }));
    try {
      const sessions = await container.inventoryRepository.listSessions();
      set({ sessions, status: 'ready' });
    } catch (error) {
      log.error('Failed to load sessions', normalizeError(error));
      set({ status: 'error' });
    }
  },

  remove: async (sessionId) => {
    await container.inventoryRepository.deleteSession(sessionId);
    container.analytics.track({ name: 'session_deleted', payload: { sessionId } });
    set((state) => ({ sessions: state.sessions.filter((s) => s.id !== sessionId) }));
  },
}));
