export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  /** Module/feature that produced the entry, e.g. `inventory:repository`. */
  readonly scope: string | undefined;
  /** Epoch milliseconds. */
  readonly timestamp: number;
  /** Structured metadata. Must never contain secrets or PII. */
  readonly context?: Record<string, unknown>;
  readonly error?: unknown;
}

/**
 * Log sink. `ConsoleTransport` today; Sentry/Crashlytics transports later
 * register through `configureLogging` with zero call-site changes.
 */
export interface LogTransport {
  handle(entry: LogEntry): void;
}
