/**
 * Device persistence contract.
 *
 * v1: AsyncStorage (localStorage on web). Future: SQLite/MMKV for large
 * datasets, or an encrypted store for tokens — each is just another
 * implementation of this interface, registered in the composition root.
 */
export interface KeyValueStorage {
  /** @returns the parsed value, or `null` when the key is absent. */
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}
