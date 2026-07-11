import type { Bottle, Category, InventorySession } from '../models';

/**
 * Inventory data access contract.
 *
 * v1: `MockInventoryRepository` (seed catalog + device storage).
 * v2: `RestInventoryRepository` calling the Node.js backend.
 * Consumers (stores/services) depend on this interface only — swapping the
 * implementation happens in the composition root, nowhere else.
 */
export interface InventoryRepository {
  getCatalog(): Promise<readonly Bottle[]>;
  getCategories(): Promise<readonly Category[]>;
  listSessions(): Promise<readonly InventorySession[]>;
  /** @throws NotFoundError when the session does not exist. */
  getSessionById(id: string): Promise<InventorySession>;
  /** Insert or replace by `session.id`. */
  saveSession(session: InventorySession): Promise<void>;
  deleteSession(id: string): Promise<void>;
}
