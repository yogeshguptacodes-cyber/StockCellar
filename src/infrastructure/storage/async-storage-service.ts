import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from './key-value-storage';

import { StorageError } from '@/core/errors';

/** AsyncStorage-backed persistence (localStorage on web). JSON-serialized. */
export class AsyncStorageService implements KeyValueStorage {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch (cause) {
      throw new StorageError(`Failed to read "${key}"`, { cause });
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (cause) {
      throw new StorageError(`Failed to write "${key}"`, { cause });
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (cause) {
      throw new StorageError(`Failed to remove "${key}"`, { cause });
    }
  }
}
