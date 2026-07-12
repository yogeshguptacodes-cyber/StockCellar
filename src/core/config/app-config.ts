import Constants from 'expo-constants';

/**
 * Typed, frozen application configuration.
 *
 * The ONLY place that reads environment variables. Components, services, and
 * repositories consume `appConfig` — they never touch `process.env`, so
 * adding staging/production environments is a config-only change.
 *
 * Expo inlines `EXPO_PUBLIC_*` variables at build time; anything secret must
 * live on the backend, never here.
 */
export type AppEnvironment = 'development' | 'staging' | 'production';

export interface AppConfig {
  readonly environment: AppEnvironment;
  readonly appVersion: string;
  /** Base URL for the future Node.js backend. Empty while v1 runs on mocks. */
  readonly apiBaseUrl: string;
  /** Master switch for analytics dispatch (defaults on; disable via env). */
  readonly analyticsEnabled: boolean;
  /**
   * Google Gemini API key for sheet extraction. Empty = mock extraction.
   * Dev/personal use only — moves behind the backend once it exists.
   */
  readonly geminiApiKey: string;
  readonly geminiModel: string;
}

function resolveEnvironment(): AppEnvironment {
  const raw = process.env.EXPO_PUBLIC_APP_ENV;
  if (raw === 'development' || raw === 'staging' || raw === 'production') {
    return raw;
  }
  return __DEV__ ? 'development' : 'production';
}

export const appConfig: AppConfig = Object.freeze({
  environment: resolveEnvironment(),
  appVersion: Constants.expoConfig?.version ?? '0.0.0',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
  analyticsEnabled: (process.env.EXPO_PUBLIC_ANALYTICS_ENABLED ?? 'true') !== 'false',
  geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
  geminiModel: process.env.EXPO_PUBLIC_GEMINI_MODEL ?? 'gemini-3.5-flash',
});
