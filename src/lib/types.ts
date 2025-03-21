/**
 * MCP Type Definitions
 */

/**
 * Server type literals
 */
export const ServerTypeLiterals = {
  NPX: 'npx',
  BINARY: 'binary'
} as const;

/**
 * Server type
 */
export type ServerType = typeof ServerTypeLiterals[keyof typeof ServerTypeLiterals];

/**
 * Server status literals
 */
export const ServerStatusLiterals = {
  RUNNING: 'running',
  STOPPED: 'stopped',
  ERROR: 'error',
  STARTING: 'starting'
} as const;

/**
 * Server status type
 */
export type ServerStatus = typeof ServerStatusLiterals[keyof typeof ServerStatusLiterals];

/**
 * Server configuration interface
 */
export interface McpServer {
  readonly type: ServerType;
  readonly command: string;
  readonly args: readonly string[];
  readonly env: Readonly<Record<string, string>>;
}

/**
 * Global configuration interface
 */
export interface GlobalConfig {
  readonly mcpServers: Readonly<Record<string, McpServer>>;
  readonly [key: string]: unknown;
}

/**
 * Configuration paths interface
 */
export interface ConfigPaths {
  global: string;
  cursor: string;
  claude: string;
  claudeDesktop: string;
  vscode: string;
}

/**
 * Server status information
 */
export interface ServerStatusInfo {
  readonly name: string;
  readonly type: ServerType;
  readonly status: ServerStatus;
  readonly startTime: string;
}

/**
 * Search result interface
 */
export interface SearchResult {
  readonly name: string;
  readonly version: string;
  readonly description: string;
}

/**
 * NPM package search result
 */
export interface NpmSearchResult {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
}

/**
 * Target application type
 */
export type TargetApp = 'cursor' | 'claude-desktop';

/**
 * Versioned configuration interface
 */
export interface VersionedConfig<T> {
  readonly version: number;
  readonly data: T;
}

/**
 * Server information interface
 */
export interface ServerInfo {
  readonly name: string;
  readonly type: ServerType;
  readonly command: string;
  readonly args: readonly string[];
  readonly env: Readonly<Record<string, string>>;
  readonly source?: 'global' | 'cursor' | 'both';
} 