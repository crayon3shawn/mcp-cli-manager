/**
 * MCP Error Types
 */

/**
 * Base error class for MCP
 */
export class McpError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    name = 'McpError'
  ) {
    super(message);
    this.name = name;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
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