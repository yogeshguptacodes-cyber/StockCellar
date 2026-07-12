import type { Category, LiquorItem, StockRegister } from '../models';

/**
 * Inventory data access contract.
 *
 * v1: `MockInventoryRepository` (seed catalog + device storage).
 * v2: `RestInventoryRepository` calling the Node.js backend.
 * Consumers depend on this interface only — swapping implementations happens
 * in the composition root, nowhere else.
 */
export interface InventoryRepository {
  getCatalog(): Promise<readonly LiquorItem[]>;
  getCategories(): Promise<readonly Category[]>;
  listRegisters(): Promise<readonly StockRegister[]>;
  /** @throws NotFoundError when the register does not exist. */
  getRegisterById(id: string): Promise<StockRegister>;
  /** Insert or replace by `register.id`. */
  saveRegister(register: StockRegister): Promise<void>;
  deleteRegister(id: string): Promise<void>;
}
