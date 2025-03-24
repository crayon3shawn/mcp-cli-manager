/**
 * Zod Schemas for MCP
 */

import { z } from 'zod';
import { ServerTypeLiterals, ServerStatusLiterals, ConnectionTypeLiterals, type WindsurfConfig, type ClineConfig } from './types.ts';

// Server Type Schema
export const serverTypeSchema = z.enum([
  ServerTypeLiterals.NPX,
  ServerTypeLiterals.BINARY,
  ServerTypeLiterals.WINDSURF,
  ServerTypeLiterals.CLINE
]);

// Server Status Schema
export const serverStatusSchema = z.enum([
  ServerStatusLiterals.RUNNING,
  ServerStatusLiterals.STOPPED,
  ServerStatusLiterals.ERROR,
  ServerStatusLiterals.STARTING
]);

// Connection Type Schema
export const connectionTypeSchema = z.enum([
  ConnectionTypeLiterals.STDIO,
  ConnectionTypeLiterals.WS
]);

// Windsurf Configuration Schema
export const windsurfConfigSchema = z.object({
  port: z.number(),
  host: z.string(),
  options: z.record(z.unknown()).optional()
}) satisfies z.ZodType<WindsurfConfig>;

// Cline Configuration Schema
export const clineConfigSchema = z.object({
  port: z.number(),
  host: z.string(),
  options: z.record(z.unknown()).optional()
}) satisfies z.ZodType<ClineConfig>;

// Stdio Connection Schema
export const stdioConnectionSchema = z.object({
  type: z.literal(ConnectionTypeLiterals.STDIO),
  command: z.string().min(1),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  config: z.union([clineConfigSchema, z.undefined()])
});

// WebSocket Connection Schema
export const wsConnectionSchema = z.object({
  type: z.literal(ConnectionTypeLiterals.WS),
  url: z.string().url(),
  config: z.union([windsurfConfigSchema, z.undefined()])
});

// Connection Schema
export const connectionSchema = z.discriminatedUnion('type', [
  stdioConnectionSchema,
  wsConnectionSchema
]);

// Server Configuration Schema
export const mcpServerSchema = z.object({
  name: z.string().min(1),
  type: serverTypeSchema,
  connection: connectionSchema
});

// Server Information Schema
export const serverInfoSchema = z.object({
  name: z.string().min(1),
  type: serverTypeSchema,
  connection: connectionSchema,
  source: z.enum(['global', 'cursor', 'both']).optional()
});

// Global Configuration Schema
export const globalConfigSchema = z.object({
  servers: z.record(serverInfoSchema),
  mcpServers: z.record(mcpServerSchema).optional()
}).catchall(z.unknown());

// Server Status Information Schema
export const serverStatusInfoSchema = z.object({
  name: z.string().min(1),
  type: serverTypeSchema,
  status: serverStatusSchema,
  startTime: z.string()
});

// Search Result Schema
export const searchResultSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string()
});

// NPM Search Result Schema
export const npmSearchResultSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional()
});

// JSON Read Options Schema
export const jsonReadOptionsSchema = z.object({
  encoding: z.enum(['utf8', 'utf-8', 'ascii', 'utf16le', 'utf-16le', 'ucs2', 'ucs-2', 'base64', 'latin1', 'binary', 'hex']).optional(),
  reviver: z.function().args(z.string(), z.any()).returns(z.any()).optional()
});

// JSON Write Options Schema
export const jsonWriteOptionsSchema = z.object({
  encoding: z.enum(['utf8', 'utf-8', 'ascii', 'utf16le', 'utf-16le', 'ucs2', 'ucs-2', 'base64', 'latin1', 'binary', 'hex']).optional(),
  replacer: z.function().args(z.string(), z.any()).returns(z.any()).optional(),
  spaces: z.number().int().min(0).optional(),
  ensureDirectory: z.boolean().optional()
});

// Versioned Configuration Schema
export const versionedConfigSchema = <T extends z.ZodType>(dataSchema: T) => 
  z.object({
    version: z.number().int().min(0),
    data: dataSchema
  }); 