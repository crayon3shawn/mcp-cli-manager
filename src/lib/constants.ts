/**
 * MCP Constants
 */

/**
 * Date format options
 */
export const DATE_FORMAT_OPTIONS = {
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
} as const;

/**
 * Process configuration
 */
export const PROCESS_CONFIG = {
  STDIO: ['ignore', 'pipe', 'pipe'] as const,
  DETACHED: true,
  SHELL: true
} as const;

/**
 * Search configuration
 */
export const SEARCH_CONFIG = {
  PREFIX: 'mcp-',
  NO_RESULTS_ERROR: 'No matches found',
  DEFAULT_DESCRIPTION: '',
  INDENT_SIZE: 3
} as const;

/**
 * Table configuration
 */
export const TABLE_CONFIG = {
  NAME_WIDTH: 25,
  STATUS_WIDTH: 11,
  TIME_WIDTH: 25,
  SEPARATOR: '-',
  DEFAULT_TIME: '-'
} as const;

/**
 * Color configuration
 */
export const COLOR_CONFIG = {
  STATUS: {
    RUNNING: 'green',
    STOPPED: 'red',
    ERROR: 'red',
    STARTING: 'yellow'
  },
  TYPE: {
    NPX: 'blue',
    BINARY: 'yellow'
  }
} as const;

/**
 * Sync configuration
 */
export const SYNC_CONFIG = {
  TARGETS: {
    CURSOR: 'cursor',
    CLAUDE_DESKTOP: 'claude-desktop'
  },
  DEFAULT_TARGET: 'cursor'
} as const; 