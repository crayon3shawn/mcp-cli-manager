/**
 * MCP Server Registration Module
 */

import { promises as fs } from 'fs';
import { getGlobalConfig, saveGlobalConfig } from './config.js';
import type { GlobalConfig, ServerInfo, ServerType } from './types.js';

/**
 * Server registration options
 */
export interface ServerOptions {
  readonly env?: Record<string, string>;
  readonly args?: string[];
}

/**
 * Cache entry interface
 */
interface CacheEntry {
  data: ServerInfo[] | null;
  expiry: number | null;
  lastModified: number | null;
}

/**
 * Cache state interface
 */
interface CacheState {
  global: CacheEntry;
  cursor: CacheEntry;
}

// Cache settings
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Cache state
const cache: CacheState = {
  global: {
    data: null,
    expiry: null,
    lastModified: null
  },
  cursor: {
    data: null,
    expiry: null,
    lastModified: null
  }
};

/**
 * Register a server
 */
export async function registerServer(
  name: string,
  type: ServerType,
  command: string,
  options: ServerOptions = {}
): Promise<void> {
  try {
    const simplifiedName = name.toLowerCase().trim();
    const config = await getGlobalConfig();
    
    // Create mutable copy of mcpServers
    const mcpServers = { ...config.mcpServers };
    
    mcpServers[simplifiedName] = {
      type,
      command,
      args: options.args ?? [],
      env: options.env ?? {}
    };

    await saveGlobalConfig({ ...config, mcpServers });
    
    // Invalidate cache
    cache.global.data = null;
    cache.global.expiry = null;
    cache.cursor.data = null;
    cache.cursor.expiry = null;
  } catch (error) {
    throw new Error(`Failed to register server: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get server information
 */
export async function getServerInfo(name: string): Promise<ServerInfo | null> {
  try {
    const config = await getGlobalConfig();
    const simplifiedName = name.toLowerCase().trim();
    const server = config.mcpServers[simplifiedName];
    
    if (!server) {
      return null;
    }

    return {
      name: simplifiedName,
      type: server.type,
      command: server.command,
      args: [...server.args],
      env: { ...server.env },
      source: 'global'
    };
  } catch (error) {
    throw new Error(`Failed to get server info: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get all registered servers
 */
export async function getRegisteredServers(): Promise<ServerInfo[]> {
  try {
    const config = await getGlobalConfig();
    const servers = Object.entries(config.mcpServers).map(([name, server]) => ({
      name,
      type: server.type,
      command: server.command,
      args: [...server.args],
      env: { ...server.env },
      source: 'global' as const
    }));
    
    return servers;
  } catch (error) {
    throw new Error(`Failed to get registered servers: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Unregister a server
 */
export async function unregisterServer(name: string): Promise<void> {
  try {
    const simplifiedName = name.toLowerCase().trim();
    const config = await getGlobalConfig();
    
    // Create mutable copy of mcpServers
    const mcpServers = { ...config.mcpServers };
    
    if (!(simplifiedName in mcpServers)) {
      throw new Error(`Server not found: ${name}`);
    }

    delete mcpServers[simplifiedName];
    await saveGlobalConfig({ ...config, mcpServers });
    
    // Invalidate cache
    cache.global.data = null;
    cache.global.expiry = null;
    cache.cursor.data = null;
    cache.cursor.expiry = null;
  } catch (error) {
    throw new Error(`Failed to unregister server: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export default {
  registerServer,
  getServerInfo,
  getRegisteredServers,
  unregisterServer
}; 