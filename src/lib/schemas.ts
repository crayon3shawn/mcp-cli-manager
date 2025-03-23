/**
 * Zod Schemas for MCP
 */

import { z } from 'zod';
import { ServerTypeLiterals, ServerStatusLiterals } from './types.js';

// Server Type Schema
export const serverTypeSchema = z.enum([ServerTypeLiterals.NPX, ServerTypeLiterals.BINARY]);

// Server Status Schema
export const serverStatusSchema = z.enum([
  ServerStatusLiterals.RUNNING,
  ServerStatusLiterals.STOPPED,
  ServerStatusLiterals.ERROR,
  ServerStatusLiterals.STARTING
]);

// Server Configuration Schema
export const mcpServerSchema = z.object({
  name: z.string().min(1),
  type: serverTypeSchema,
  command: z.string().min(1),
  args: z.array(z.string()),
  env: z.record(z.string())
});

// Server Information Schema
export const serverInfoSchema = z.object({
  name: z.string().min(1),
  type: serverTypeSchema,
  command: z.string().min(1),
  args: z.array(z.string()),
  env: z.record(z.string()),
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