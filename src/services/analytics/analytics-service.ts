import type { AnalyticsEvent } from './analytics-events';

/**
 * Analytics sink. Console provider in v1; Firebase/Mixpanel/Amplitude later —
 * register additional providers in the composition root, nothing else changes.
 */
export interface AnalyticsProvider {
  track(event: AnalyticsEvent): void;
}

export class AnalyticsService {
  constructor(
    private readonly providers: readonly AnalyticsProvider[],
    private readonly enabled: boolean,
  ) {}

  track(event: AnalyticsEvent): void {
    if (!this.enabled) {
      return;
    }
    for (const provider of this.providers) {
      try {
        provider.track(event);
      } catch {
        // Analytics must never break the product experience.
      }
    }
  }
}
