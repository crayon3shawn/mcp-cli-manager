/**
 * MCP Server List Display Module
 * 
 * This module is responsible for:
 * 1. Formatting and displaying server lists
 * 2. Providing different display formats (table, JSON, simple list)
 */

import chalk from 'chalk';
import type { ServerInfo, ServerType } from './types.js';
import { getRegisteredServers } from './regist.js';
import type { SearchResult } from './search.js';

/**
 * Search results interface
 */
interface SearchResults {
  installed: ServerInfo[];
  available: SearchResult[];
}

/**
 * Table configuration
 */
const TABLE_CONFIG = {
  NAME_WIDTH: 25,
  TYPE_WIDTH: 8,
  SOURCE_WIDTH: 8,
  SEPARATOR: '-'
} as const;

/**
 * Type color mapping
 */
const TYPE_COLORS: Record<ServerType, (text: string) => string> = {
  npx: chalk.green,
  binary: chalk.blue
} as const;

/**
 * Source color mapping
 */
const SOURCE_COLORS: Record<string, (text: string) => string> = {
  global: chalk.yellow,
  cursor: chalk.cyan,
  'claude-desktop': chalk.magenta
} as const;

/**
 * Format server entry for display
 */
function formatServerEntry(server: ServerInfo): string {
  const { name, type } = server;
  const source = server.source || 'global';
  const typeColor = TYPE_COLORS[type] || chalk.white;
  const sourceColor = SOURCE_COLORS[source] || chalk.white;

  return [
    name.padEnd(TABLE_CONFIG.NAME_WIDTH),
    typeColor(type.padEnd(TABLE_CONFIG.TYPE_WIDTH)),
    sourceColor(source.padEnd(TABLE_CONFIG.SOURCE_WIDTH))
  ].join(' | ');
}

/**
 * Format server list as table
 */
function formatServerTable(servers: ServerInfo[]): string {
  if (servers.length === 0) {
    return 'No servers registered';
  }

  const header = [
    'Name'.padEnd(TABLE_CONFIG.NAME_WIDTH),
    'Type'.padEnd(TABLE_CONFIG.TYPE_WIDTH),
    'Source'.padEnd(TABLE_CONFIG.SOURCE_WIDTH)
  ].join(' | ');

  const separator = [
    TABLE_CONFIG.SEPARATOR.repeat(TABLE_CONFIG.NAME_WIDTH),
    TABLE_CONFIG.SEPARATOR.repeat(TABLE_CONFIG.TYPE_WIDTH),
    TABLE_CONFIG.SEPARATOR.repeat(TABLE_CONFIG.SOURCE_WIDTH)
  ].join('-+-');

  const rows = servers.map(formatServerEntry);

  return [header, separator, ...rows].join('\n');
}

/**
 * Format server list as JSON string
 */
function formatServerJson(servers: ServerInfo[]): string {
  return JSON.stringify(servers, null, 2);
}

/**
 * Format server list as simple list
 */
function formatServerList(servers: ServerInfo[]): string {
  if (servers.length === 0) {
    return 'No servers registered';
  }
  return servers.map(s => s.name).join('\n');
}

/**
 * Get and display installed MCP server list
 */
export async function listServers(format: 'table' | 'json' | 'list' = 'table'): Promise<string> {
  try {
    const servers = await getRegisteredServers();
    
    switch (format) {
      case 'json':
        return formatServerJson(servers);
      case 'list':
        return formatServerList(servers);
      default:
        return formatServerTable(servers);
    }
  } catch (error) {
    throw new Error(`Failed to list servers: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Format search results as string
 */
export function formatSearchResults(results: ServerInfo[]): string {
  return formatServerTable(results);
} 