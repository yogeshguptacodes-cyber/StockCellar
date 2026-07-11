import type { AnalyticsEvent } from './analytics-events';
import type { AnalyticsProvider } from './analytics-service';

import { createLogger } from '@/core/logger';

/** Development provider — writes events to the app log. */
export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  private readonly log = createLogger('analytics');

  track(event: AnalyticsEvent): void {
    this.log.info(event.name, 'payload' in event ? event.payload : undefined);
  }
}
