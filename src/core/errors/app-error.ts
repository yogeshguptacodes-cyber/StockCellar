/**
 * Typed error hierarchy.
 *
 * Every error crossing a layer boundary (repository → service → store → UI)
 * must be an `AppError`. UI maps `code` to user-facing copy; the logger and
 * analytics consume `context`. Raw `Error`/unknown values are converted at
 * the boundary via `normalizeError`.
 */
export type AppErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'VALIDATION'
  | 'STORAGE'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'CONFLICT'
  | 'UNKNOWN';

export interface AppErrorOptions {
  /** Underlying error, preserved for logging/debugging. */
  readonly cause?: unknown;
  /** Structured data safe for logs/analytics. Never secrets or PII. */
  readonly context?: Record<string, unknown>;
}

export abstract class AppError extends Error {
  abstract readonly code: AppErrorCode;
  /** `true` for expected, recoverable conditions; `false` for programming bugs. */
  readonly isOperational: boolean = true;
  readonly context: Record<string, unknown> | undefined;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.context = options.context;
  }
}

/** Request could not reach the server or the connection dropped. */
export class NetworkError extends AppError {
  readonly code = 'NETWORK';
}

/** Operation exceeded its time budget. */
export class TimeoutError extends AppError {
  readonly code = 'TIMEOUT';
}

/** User input or data payload failed validation. */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION';
  /** Per-field messages for form UIs, keyed by field name. */
  readonly fieldErrors: Readonly<Record<string, string>>;

  constructor(
    message: string,
    fieldErrors: Readonly<Record<string, string>> = {},
    options: AppErrorOptions = {},
  ) {
    super(message, options);
    this.fieldErrors = fieldErrors;
  }
}

/** Local persistence (storage/database) failed. */
export class StorageError extends AppError {
  readonly code = 'STORAGE';
}

/** A required OS permission (camera, photos, notifications) was denied. */
export class PermissionError extends AppError {
  readonly code = 'PERMISSION_DENIED';
}

/** Requested entity does not exist. */
export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
}

/** Caller is not authenticated / session expired. */
export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED';
}

/** Concurrent modification conflict (relevant for future sync). */
export class ConflictError extends AppError {
  readonly code = 'CONFLICT';
}

/** Anything unexpected — treated as a bug, not an operational condition. */
export class UnknownError extends AppError {
  readonly code = 'UNKNOWN';
  override readonly isOperational = false;
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/** Convert any thrown value into a typed `AppError` at layer boundaries. */
export function normalizeError(value: unknown): AppError {
  if (isAppError(value)) {
    return value;
  }
  if (value instanceof Error) {
    return new UnknownError(value.message, { cause: value });
  }
  return new UnknownError('An unexpected error occurred', {
    context: { thrownValue: String(value) },
  });
}
