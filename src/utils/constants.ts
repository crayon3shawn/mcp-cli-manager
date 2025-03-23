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

/**
 * MCP CLI Constants
 */
import { join } from 'path';
import os from 'os';

export const Constants = {
  TIMEOUTS: {
    START: 60000,        // 伺服器啟動超時（毫秒）
    STOP: 5000,         // 伺服器停止超時（毫秒）
    CACHE: 300000       // 快取有效期（5分鐘）
  },
  PATHS: {
    ROOT: join(os.homedir(), '.mcp'),
    PID_DIR: join(os.homedir(), '.mcp', 'pids'),
    LOG_DIR: join(os.homedir(), '.mcp', 'logs'),
    CONFIG_DIR: join(os.homedir(), '.mcp', 'config')
  },
  PERMISSIONS: {
    DIR: 0o700,         // rwx------
    FILE: 0o600         // rw-------
  },
  PROCESS: {
    START_CHECK_INTERVAL: 100,   // 檢查伺服器啟動狀態的間隔（毫秒）
    STOP_CHECK_INTERVAL: 100,    // 檢查伺服器停止狀態的間隔（毫秒）
    KILL_TIMEOUT: 5000          // 強制結束進程前的等待時間（毫秒）
  },
  LOG: {
    MAX_SIZE: 10 * 1024 * 1024,  // 日誌檔案最大大小（10MB）
    MAX_FILES: 5,                // 保留的日誌檔案數量
    ROTATION_FREQUENCY: '1d'      // 日誌輪替頻率
  }
} as const; 