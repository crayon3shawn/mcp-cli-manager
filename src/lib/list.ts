/**
 * MCP Server List Module
 */

import kleur from 'kleur';
import boxen from 'boxen';
import { getServerStatus } from './status.js';
import { getInstalledServers } from './install.js';
import { ServerStatus, ServerInfo, ServerStatusLiterals } from './types.js';

const STATUS_COLORS = {
  [ServerStatusLiterals.RUNNING]: kleur.green,
  [ServerStatusLiterals.STOPPED]: kleur.red,
  [ServerStatusLiterals.ERROR]: kleur.red,
  [ServerStatusLiterals.STARTING]: kleur.yellow
} as const;

/**
 * Format server status for display
 */
const formatServerStatus = async (server: ServerInfo): Promise<string> => {
  const status = await getServerStatus(server.name);
  const colorize = STATUS_COLORS[status] || kleur.gray;
  return `${server.name} [${colorize(status)}]`;
};

/**
 * List installed servers
 */
export const listServers = async (): Promise<string> => {
  try {
    const servers = await getInstalledServers();
    if (servers.length === 0) {
      return boxen('尚未安裝任何伺服器', {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'yellow'
      });
    }

    const serversWithStatus = await Promise.all(
      servers.map((server: ServerInfo) => formatServerStatus(server))
    );

    return boxen(serversWithStatus.join('\n'), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'blue'
    });
  } catch (error) {
    if (error instanceof Error) {
      return boxen(`列出伺服器時發生錯誤: ${error.message}`, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'red'
      });
    }
    return boxen('列出伺服器時發生未知錯誤', {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'red'
    });
  }
}; 