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
 * Server information interface
 */
export interface ServerInfo {
  name: string;
  type: ServerType;
  command: string;
  args: string[];
  env: Record<string, string>;
  source?: 'global' | 'cursor' | 'both';
}

/**
 * Global configuration interface
 */
export interface GlobalConfig {
  servers: Record<string, ServerInfo>;
  mcpServers?: Record<string, ServerInfo>;
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
  name: string;
  type: ServerType;
  status: ServerStatus;
  startTime: string;
}

/**
 * Search result interface
 */
export interface SearchResult {
  name: string;
  version: string;
  description: string;
  author: string;
  lastUpdated: string;
}

/**
 * Target application type
 */
export type TargetApp = 'cursor' | 'claude-desktop';

/**
 * Versioned configuration interface
 */
export interface VersionedConfig<T> {
  version: number;
  data: T;
}

/**
 * NPM package search result
 */
export interface NpmSearchResult {
  name: string;
  version: string;
  description?: string;
  author?: {
    name: string;
  };
  date?: string;
} 