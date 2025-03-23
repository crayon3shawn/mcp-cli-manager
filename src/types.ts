/**
 * MCP Type Definitions
 */

/**
 * Server type literals
 */
export const Type = {
  NPX: 'npx',
  BINARY: 'binary'
} as const;

/**
 * Server type
 */
export type ServerType = 'npx' | 'binary';

/**
 * Server status
 */
export enum Status {
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error'
}

/**
 * Server source
 */
export type ServerSource = 'npm' | 'github' | 'local' | 'global';

/**
 * Server metadata
 */
export interface Metadata {
  installedAt: string;
  version?: string;
  lastUpdated?: string;
  installOptions?: InstallOptions;
}

/**
 * Server startup configuration
 */
export interface StartupConfig {
  successPatterns?: string[];
  errorPatterns?: string[];
  startupTimeout?: number;
  maxStartupLines?: number;
  maxStartupErrors?: number;
}

/**
 * Server information
 */
export interface ServerInfo {
  readonly name: string;
  readonly type: ServerType;
  readonly command: string;
  readonly args?: string[];
  readonly env?: Record<string, string>;
  readonly metadata?: Metadata;
  readonly source: ServerSource;
  readonly startup?: StartupConfig;
}

/**
 * Server status information
 */
export interface StatusInfo {
  name: string;
  type: ServerType;
  status: Status;
  pid?: number;
  uptime?: number;
  error?: string;
  startTime?: string;
  source: ServerSource;
}

/**
 * NPM search result
 */
export interface NpmSearchResult {
  name: string;
  description: string;
  version: string;
  date: string;
  links: {
    npm: string;
    homepage?: string;
    repository?: string;
    bugs?: string;
  };
  author?: {
    name: string;
    email?: string;
    url?: string;
  };
  keywords?: string[];
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
}

/**
 * Search options
 */
export interface SearchOptions {
  query: string;
  type?: ServerType;
  source?: ServerSource;
  limit?: number;
}

/**
 * Search result
 */
export interface SearchResult {
  name: string;
  description?: string;
  version?: string;
  type: ServerType;
  source: ServerSource;
  matchScore: number;
  npmInfo?: NpmSearchResult;
}

/**
 * Install options
 */
export interface InstallOptions {
  version?: string;
  force?: boolean;
}

/**
 * Install result
 */
export interface InstallResult {
  success: boolean;
  server?: ServerInfo;
  error?: string;
}

/**
 * Process error
 */
export class ProcessError extends Error {
  readonly code?: string;
  
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ProcessError';
    this.code = code;
  }
}

/**
 * Configuration error
 */
export class ConfigError extends Error {
  readonly code?: string;
  
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ConfigError';
    this.code = code;
  }
}

/**
 * Search error
 */
export class SearchError extends Error {
  readonly code?: string;
  
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'SearchError';
    this.code = code;
  }
} 