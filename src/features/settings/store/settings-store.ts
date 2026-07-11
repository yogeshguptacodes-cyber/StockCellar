import { create } from 'zustand';

import { container } from '@/core/di/container';
import { createLogger } from '@/core/logger';
import type { ThemePreference } from '@/theme';

const THEME_KEY = 'settings.themePreference.v1';
const log = createLogger('settings:store');

interface SettingsState {
  themePreference: ThemePreference;
  hydrated: boolean;
  /** Load persisted preferences. Called once at startup (never during SSR). */
  hydrate: () => Promise<void>;
  setThemePreference: (preference: ThemePreference) => void;
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  themePreference: 'system',
  hydrated: false,

  hydrate: async () => {
    try {
      const stored = await container.storage.getItem<string>(THEME_KEY);
      set({
        themePreference: isThemePreference(stored) ? stored : 'system',
        hydrated: true,
      });
    } catch (error) {
      log.warn('Failed to hydrate settings; using defaults', { error: String(error) });
      set({ hydrated: true });
    }
  },

  setThemePreference: (preference) => {
    set({ themePreference: preference });
    container.analytics.track({ name: 'theme_changed', payload: { preference } });
    void container.storage
      .setItem(THEME_KEY, preference)
      .catch((error: unknown) => log.warn('Failed to persist theme', { error: String(error) }));
  },
}));
