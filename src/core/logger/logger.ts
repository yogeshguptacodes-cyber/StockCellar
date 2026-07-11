import { ConsoleTransport } from './console-transport';
import type { LogEntry, LogLevel, LogTransport } from './types';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

interface LoggingConfig {
  minLevel: LogLevel;
  transports: readonly LogTransport[];
}

const config: LoggingConfig = {
  minLevel: __DEV__ ? 'debug' : 'info',
  transports: [new ConsoleTransport()],
};

/**
 * Reconfigure logging at app startup — e.g. raise the level and attach a
 * Sentry transport in production builds. Call before rendering the tree.
 */
export function configureLogging(overrides: Partial<LoggingConfig>): void {
  if (overrides.minLevel !== undefined) {
    config.minLevel = overrides.minLevel;
  }
  if (overrides.transports !== undefined) {
    config.transports = overrides.transports;
  }
}

export class Logger {
  constructor(private readonly scope?: string) {}

  /** Derive a narrower logger: `createLogger('inventory').child('repository')`. */
  child(scope: string): Logger {
    return new Logger(this.scope ? `${this.scope}:${scope}` : scope);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.emit('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.emit('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.emit('warn', message, context);
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    this.emit('error', message, context, error);
  }

  private emit(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: unknown,
  ): void {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[config.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      scope: this.scope,
      timestamp: Date.now(),
      ...(context !== undefined ? { context } : {}),
      ...(error !== undefined ? { error } : {}),
    };

    for (const transport of config.transports) {
      try {
        transport.handle(entry);
      } catch {
        // A faulty transport must never crash the app or mask the original log.
      }
    }
  }
}

/** Scoped logger factory — the standard way to obtain a logger. */
export function createLogger(scope: string): Logger {
  return new Logger(scope);
}
