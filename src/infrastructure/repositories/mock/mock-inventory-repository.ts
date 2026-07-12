import { seedCategories, seedItems } from './seed-data';

import { NotFoundError } from '@/core/errors';
import { createLogger } from '@/core/logger';
import type { Category, LiquorItem, StockRegister } from '@/domain/models';
import type { InventoryRepository } from '@/domain/repositories';
import type { KeyValueStorage } from '@/infrastructure/storage';

const REGISTERS_KEY = 'inventory.registers.v2';
/** Small artificial latency keeps loading states honest before the real API. */
const SIMULATED_LATENCY_MS = 150;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockInventoryRepository implements InventoryRepository {
  private readonly log = createLogger('inventory:mock-repository');

  constructor(private readonly storage: KeyValueStorage) {}

  async getCatalog(): Promise<readonly LiquorItem[]> {
    await delay(SIMULATED_LATENCY_MS);
    return seedItems;
  }

  async getCategories(): Promise<readonly Category[]> {
    await delay(SIMULATED_LATENCY_MS);
    return seedCategories;
  }

  async listRegisters(): Promise<readonly StockRegister[]> {
    const registers = await this.storage.getItem<StockRegister[]>(REGISTERS_KEY);
    return registers ?? [];
  }

  async getRegisterById(id: string): Promise<StockRegister> {
    const register = (await this.listRegisters()).find((r) => r.id === id);
    if (!register) {
      throw new NotFoundError(`Stock register "${id}" not found`);
    }
    return register;
  }

  async saveRegister(register: StockRegister): Promise<void> {
    const existing = await this.listRegisters();
    const next = [register, ...existing.filter((r) => r.id !== register.id)];
    await this.storage.setItem(REGISTERS_KEY, next);
    this.log.debug('Register saved', { registerId: register.id, rows: register.rows.length });
  }

  async deleteRegister(id: string): Promise<void> {
    const existing = await this.listRegisters();
    await this.storage.setItem(
      REGISTERS_KEY,
      existing.filter((r) => r.id !== id),
    );
    this.log.debug('Register deleted', { registerId: id });
  }
}
