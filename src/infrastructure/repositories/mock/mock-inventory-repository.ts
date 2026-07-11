import { seedBottles, seedCategories } from './seed-data';

import { NotFoundError } from '@/core/errors';
import { createLogger } from '@/core/logger';
import type { Bottle, Category, InventorySession } from '@/domain/models';
import type { InventoryRepository } from '@/domain/repositories';
import type { KeyValueStorage } from '@/infrastructure/storage';

const SESSIONS_KEY = 'inventory.sessions.v1';
/** Small artificial latency keeps loading states honest before the real API. */
const SIMULATED_LATENCY_MS = 150;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockInventoryRepository implements InventoryRepository {
  private readonly log = createLogger('inventory:mock-repository');

  constructor(private readonly storage: KeyValueStorage) {}

  async getCatalog(): Promise<readonly Bottle[]> {
    await delay(SIMULATED_LATENCY_MS);
    return seedBottles;
  }

  async getCategories(): Promise<readonly Category[]> {
    await delay(SIMULATED_LATENCY_MS);
    return seedCategories;
  }

  async listSessions(): Promise<readonly InventorySession[]> {
    const sessions = await this.storage.getItem<InventorySession[]>(SESSIONS_KEY);
    return sessions ?? [];
  }

  async getSessionById(id: string): Promise<InventorySession> {
    const session = (await this.listSessions()).find((s) => s.id === id);
    if (!session) {
      throw new NotFoundError(`Inventory session "${id}" not found`);
    }
    return session;
  }

  async saveSession(session: InventorySession): Promise<void> {
    const existing = await this.listSessions();
    const next = [session, ...existing.filter((s) => s.id !== session.id)];
    await this.storage.setItem(SESSIONS_KEY, next);
    this.log.debug('Session saved', { sessionId: session.id, entries: session.entries.length });
  }

  async deleteSession(id: string): Promise<void> {
    const existing = await this.listSessions();
    await this.storage.setItem(
      SESSIONS_KEY,
      existing.filter((s) => s.id !== id),
    );
    this.log.debug('Session deleted', { sessionId: id });
  }
}
