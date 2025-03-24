/**
 * MCP Types
 */

import { z } from 'zod';
import { serverTypeSchema, serverStatusSchema, connectionSchema, serverInfoSchema } from './schemas.ts';

// Base Types
export type ServerType = z.infer<typeof serverTypeSchema>;
export type ServerStatus = z.infer<typeof serverStatusSchema>;
export type Connection = z.infer<typeof connectionSchema>;
export type ServerInfo = z.infer<typeof serverInfoSchema>;

// Literals
export const ServerTypeLiterals = {
  WINDSURF: 'windsurf',
  CLINE: 'cline',
  NPX: 'npx',
  BINARY: 'binary'
} as const;

export const ServerStatusLiterals = {
  RUNNING: 'running',
  STOPPED: 'stopped',
  ERROR: 'error',
  STARTING: 'starting'
} as const;

export const ConnectionTypeLiterals = {
  STDIO: 'stdio',
  WS: 'ws'
} as const;

// Literal Types
export type ServerTypeLiterals = typeof ServerTypeLiterals[keyof typeof ServerTypeLiterals];
export type ServerStatusLiterals = typeof ServerStatusLiterals[keyof typeof ServerStatusLiterals];
export type ConnectionTypeLiterals = typeof ConnectionTypeLiterals[keyof typeof ConnectionTypeLiterals];

// Configuration Types
export interface WindsurfConfig {
  port: number;
  host: string;
  options?: Record<string, unknown>;
}

export interface ClineConfig {
  port: number;
  host: string;
  options?: Record<string, unknown>;
}

// Connection Types
export interface StdioConnection {
  type: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
  config?: WindsurfConfig | ClineConfig;
}

export interface WSConnection {
  type: 'ws';
  url: string;
  config?: WindsurfConfig | ClineConfig;
}

// Process Types
export interface ServerProcess {
  pid: number;
  status: ServerStatus;
  startTime: Date;
  endTime?: Date;
}

export interface ServerLog {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
}

export interface ServerMetrics {
  cpu: number;
  memory: number;
  uptime: number;
}

export interface ServerHealth {
  status: 'healthy' | 'unhealthy';
  message?: string;
  lastCheck: Date;
}

export interface ServerStats {
  connections: number;
  requests: number;
  errors: number;
  latency: number;
}

export interface ServerConfig {
  name: string;
  type: ServerType;
  connection: Connection;
  env?: Record<string, string>;
  timeout?: number;
  retries?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  metrics?: boolean;
  healthCheck?: boolean;
  stats?: boolean;
}

export interface ServerMetadata {
  version: string;
  description?: string;
  author?: string;
  license?: string;
  repository?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  config?: Record<string, unknown>;
  date?: string;
} 