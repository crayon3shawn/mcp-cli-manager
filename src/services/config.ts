/**
 * MCP Configuration Management Module
 * Handles server configuration storage and retrieval
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import os from 'os';
import Conf from 'conf';
import { type ServerInfo } from '../types.js';

const config = new Conf({
  projectName: 'mcp-cli-manager',
  schema: {
    servers: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          command: { type: 'string' },
          args: { type: 'array', items: { type: 'string' } },
          env: { type: 'object' },
          metadata: { type: 'object' },
          source: { type: 'string' }
        }
      }
    }
  }
});

/**
 * Get server information
 */
export async function getServerInfo(name: string): Promise<ServerInfo | null> {
  const servers = config.get('servers') as Record<string, ServerInfo> || {};
  return servers[name] || null;
}

/**
 * Get all installed servers
 */
export async function getInstalledServers(): Promise<ServerInfo[]> {
  const servers = config.get('servers') as Record<string, ServerInfo> || {};
  return Object.values(servers);
}

/**
 * Save server configuration
 */
export async function saveServerConfig(server: ServerInfo): Promise<void> {
  const servers = config.get('servers') as Record<string, ServerInfo> || {};
  servers[server.name] = server;
  config.set('servers', servers);
}

/**
 * Remove server configuration
 */
export async function removeServerConfig(name: string): Promise<void> {
  const servers = config.get('servers') as Record<string, ServerInfo> || {};
  delete servers[name];
  config.set('servers', servers);
}

/**
 * Get configuration directory
 */
export function getConfigDir(): string {
  return join(os.homedir(), '.mcp-cli-manager');
}

/**
 * Initialize configuration
 */
export async function initConfig(): Promise<void> {
  const configDir = getConfigDir();
  try {
    await fs.access(configDir);
  } catch {
    await fs.mkdir(configDir, { recursive: true });
  }
} 