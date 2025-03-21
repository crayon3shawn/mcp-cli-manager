/**
 * MCP Server Status Check Module
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { getRegisteredServers, getServerInfo } from './regist.js';
import { getServerProcess } from './process.js';
import { StatusError } from './errors.js';
import { ServerTypeLiterals, ServerStatusLiterals, type ServerType, type ServerStatus, type ServerStatusInfo } from './types.js';

const execAsync = promisify(exec);

/**
 * Status color mapping
 */
const STATUS_COLORS: Record<ServerStatus, (text: string) => string> = {
  [ServerStatusLiterals.RUNNING]: chalk.green,
  [ServerStatusLiterals.STOPPED]: chalk.red,
  [ServerStatusLiterals.ERROR]: chalk.red,
  [ServerStatusLiterals.STARTING]: chalk.yellow
} as const;

/**
 * Type color mapping
 */
const TYPE_COLORS: Record<ServerType, (text: string) => string> = {
  [ServerTypeLiterals.NPX]: chalk.blue,
  [ServerTypeLiterals.BINARY]: chalk.yellow
} as const;

/**
 * Table formatting configuration
 */
const TABLE_CONFIG = {
  NAME_WIDTH: 25,
  STATUS_WIDTH: 11,
  TIME_WIDTH: 25,
  SEPARATOR: '-',
  DEFAULT_TIME: '-'
} as const;

/**
 * Get colored status text
 */
const getColoredStatus = (status: ServerStatus): string =>
  STATUS_COLORS[status]?.(status) ?? chalk.gray(status);

/**
 * Get colored type text
 */
const getColoredType = (type: ServerType): string =>
  TYPE_COLORS[type]?.(type === ServerTypeLiterals.NPX ? 'npx' : 'bin') ?? chalk.gray(type);

/**
 * Create default status info
 */
const createDefaultStatus = (name: string, type: ServerType, status: ServerStatus): ServerStatusInfo => ({
  name,
  type,
  status,
  startTime: TABLE_CONFIG.DEFAULT_TIME
});

/**
 * Check server status
 */
const checkServerStatus = async (name: string, type: ServerType): Promise<ServerStatusInfo> => {
  try {
    const process = getServerProcess(name);
    
    if (!process) {
      return createDefaultStatus(name, type, ServerStatusLiterals.STOPPED);
    }

    try {
      process.kill(0); // Test if process exists
      return {
        name,
        type,
        status: ServerStatusLiterals.RUNNING,
        startTime: process.startTime || TABLE_CONFIG.DEFAULT_TIME
      };
    } catch {
      return createDefaultStatus(name, type, ServerStatusLiterals.STOPPED);
    }
  } catch (error) {
    throw new StatusError(`Failed to check status for server ${name}`, error);
  }
};

/**
 * Get status of all servers
 */
const getServersStatus = async (): Promise<ServerStatusInfo[]> => {
  try {
    const servers = await getRegisteredServers();
    return await Promise.all(
      servers.map(server => checkServerStatus(server.name, server.type))
    );
  } catch (error) {
    throw new StatusError('Failed to get servers status', error);
  }
};

/**
 * Get status of a specific server
 */
const getServerStatus = async (name: string): Promise<ServerStatusInfo> => {
  try {
    const server = await getServerInfo(name);
    if (!server) {
      throw new StatusError(`Server not found: ${name}`);
    }
    return await checkServerStatus(server.name, server.type);
  } catch (error) {
    throw new StatusError(`Failed to get status for server ${name}`, error);
  }
};

/**
 * Format server status as table string
 */
const formatStatusTable = (servers: ServerStatusInfo[]): string => {
  if (!servers?.length) {
    return 'No MCP servers installed\n';
  }

  const { NAME_WIDTH, STATUS_WIDTH, TIME_WIDTH, SEPARATOR } = TABLE_CONFIG;
  
  const header = [
    'name'.padEnd(NAME_WIDTH),
    'status'.padEnd(STATUS_WIDTH),
    'startTime'
  ].join('| ');

  const separator = SEPARATOR.repeat(NAME_WIDTH + STATUS_WIDTH + TIME_WIDTH + 2);

  const rows = servers.map(({ name, type, status, startTime }) => [
    `${name} (${getColoredType(type)})`.padEnd(NAME_WIDTH),
    getColoredStatus(status).padEnd(STATUS_WIDTH),
    startTime || TABLE_CONFIG.DEFAULT_TIME
  ].join('| ')).join('\n');

  return ['\n', header, separator, rows, '\n'].join('\n');
};

/**
 * Get and display MCP server status
 */
const getStatus = async (): Promise<string> => {
  try {
    const servers = await getServersStatus();
    return formatStatusTable(servers);
  } catch (error) {
    throw new StatusError('Failed to get server status', error);
  }
};

export {
  getServersStatus,
  getServerStatus,
  formatStatusTable,
  getStatus
}; 