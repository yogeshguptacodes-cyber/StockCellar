import type { LogEntry, LogLevel, LogTransport } from './types';

/**
 * Development transport writing to the JS console.
 *
 * This file is the ONLY sanctioned use of `console.*` in the codebase —
 * everything else goes through `Logger` so production sinks can be swapped in
 * without touching call sites.
 */
/* eslint-disable no-console */
const CONSOLE_METHOD: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};
/* eslint-enable no-console */

export class ConsoleTransport implements LogTransport {
  handle(entry: LogEntry): void {
    const time = new Date(entry.timestamp).toISOString();
    const scope = entry.scope ? ` [${entry.scope}]` : '';
    const line = `${time} ${entry.level.toUpperCase()}${scope} ${entry.message}`;

    const args: unknown[] = [line];
    if (entry.context !== undefined) {
      args.push(entry.context);
    }
    if (entry.error !== undefined) {
      args.push(entry.error);
    }

    CONSOLE_METHOD[entry.level](...args);
  }
}
