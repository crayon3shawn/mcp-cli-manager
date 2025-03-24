/**
 * MCP Error Classes
 */

/**
 * Base error class for MCP
 */
export class McpError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'McpError';
  }
}

/**
 * Configuration error
 */
export class ConfigError extends McpError {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ConfigError';
    this.cause = cause;
  }
}

/**
 * Validation error
 */
export class ValidationError extends McpError {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ValidationError';
    this.cause = cause;
  }
}

/**
 * Server error
 */
export class ServerError extends McpError {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ServerError';
    this.cause = cause;
  }
}

/**
 * Process error
 */
export class ProcessError extends McpError {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ProcessError';
    this.cause = cause;
  }
}

/**
 * File system error
 */
export class FileSystemError extends McpError {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'FileSystemError';
    this.cause = cause;
  }
}

/**
 * Search error
 */
export class SearchError extends McpError {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'SearchError';
    this.cause = cause;
  }
}

/**
 * Status error
 */
export class StatusError extends McpError {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'StatusError';
    this.cause = cause;
  }
}

/**
 * Create error instance from unknown error
 */
export function createError<T extends McpError>(
  ErrorClass: new (message: string, cause?: Error) => T,
  error: unknown,
  defaultMessage = 'Unknown error'
): T {
  const message = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error ? error : undefined;
  return new ErrorClass(message || defaultMessage, cause);
}

export default {
  McpError,
  ConfigError,
  ValidationError,
  ServerError,
  ProcessError,
  FileSystemError,
  SearchError,
  StatusError,
  createError
}; 