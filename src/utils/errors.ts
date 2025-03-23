/**
 * MCP Error Types
 */

/**
 * Base error class for MCP CLI Manager
 */
export class McpError extends Error {
  constructor(message: string, cause?: unknown, type: string = 'McpError') {
    super(message);
    this.name = type;
    this.cause = cause;
  }
}

/**
 * Configuration related errors
 */
export class ConfigError extends McpError {
  constructor(message: string, cause?: unknown) {
    super(message, cause, 'ConfigError');
  }
}

/**
 * File system related errors
 */
export class FileSystemError extends McpError {
  constructor(message: string, cause?: unknown) {
    super(message, cause, 'FileSystemError');
  }
}

/**
 * Process related errors
 */
export class ProcessError extends McpError {
  constructor(message: string, cause?: unknown) {
    super(message, cause, 'ProcessError');
  }
}

/**
 * Search related errors
 */
export class SearchError extends McpError {
  constructor(message: string, cause?: unknown) {
    super(message, cause, 'SearchError');
  }
}

/**
 * Status related errors
 */
export class StatusError extends McpError {
  constructor(message: string, cause?: unknown) {
    super(message, cause, 'StatusError');
  }
}

/**
 * Validation related errors
 */
export class ValidationError extends McpError {
  constructor(message: string, cause?: unknown) {
    super(message, cause, 'ValidationError');
  }
}

/**
 * Create an error instance from an unknown error
 */
export function createError(
  error: unknown,
  defaultMessage = 'An unexpected error occurred',
  ErrorClass = McpError
): McpError {
  if (error instanceof McpError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new ErrorClass(message || defaultMessage, error);
} 