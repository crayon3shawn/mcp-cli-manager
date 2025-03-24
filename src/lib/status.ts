/**
 * MCP Server Status Module
 */

import { execa } from 'execa';
import { ServerTypeLiterals, type ServerInfo, type ServerStatus } from './types.js';
import { ValidationError } from './errors.js';
import { serverInfoSchema } from './schemas.js';
import { getGlobalConfig } from './config.js';
import ora from 'ora';
import kleur from 'kleur';
import boxen from 'boxen';

/**
 * Get server status
 */
export const getServerStatus = async (name: string): Promise<ServerStatus> => {
  const spinner = ora('正在檢查伺服器狀態...').start();

  try {
    const config = await getGlobalConfig();
    if (!config.servers) {
      spinner.fail('伺服器不存在');
      throw new ValidationError(`伺服器 ${name} 不存在`);
    }
    const server = config.servers[name];

    if (!server) {
      spinner.fail('伺服器不存在');
      throw new ValidationError(`伺服器 ${name} 不存在`);
    }

    // Validate server info
    const serverInfo = serverInfoSchema.parse(server);

    // Check server status based on type
    if (serverInfo.type === ServerTypeLiterals.NPX) {
      try {
        await execa('npx', ['-y', serverInfo.connection.type === 'stdio' ? serverInfo.connection.command : '', '--version'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });
        return 'running';
      } catch {
        return 'stopped';
      }
    } else if (serverInfo.type === ServerTypeLiterals.BINARY) {
      try {
        await execa(serverInfo.connection.type === 'stdio' ? serverInfo.connection.command : '', ['--version'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });
        return 'running';
      } catch {
        return 'stopped';
      }
    } else if (serverInfo.type === ServerTypeLiterals.WINDSURF) {
      // For Windsurf, we need to check if the WebSocket server is accessible
      if (serverInfo.connection.type === 'ws') {
        try {
          await execa('node', ['-e', `
            const WebSocket = require('ws');
            const ws = new WebSocket('${serverInfo.connection.url}');
            ws.on('open', () => {
              console.log('Connected to Windsurf server');
              process.exit(0);
            });
            ws.on('error', () => {
              process.exit(1);
            });
          `], {
            stdio: ['pipe', 'pipe', 'pipe']
          });
          return 'running';
        } catch {
          return 'stopped';
        }
      }
      return 'stopped';
    } else if (serverInfo.type === ServerTypeLiterals.CLINE) {
      // For Cline, we need to check if the WebSocket server is accessible
      if (serverInfo.connection.type === 'ws') {
        try {
          await execa('node', ['-e', `
            const WebSocket = require('ws');
            const ws = new WebSocket('${serverInfo.connection.url}');
            ws.on('open', () => {
              console.log('Connected to Cline server');
              process.exit(0);
            });
            ws.on('error', () => {
              process.exit(1);
            });
          `], {
            stdio: ['pipe', 'pipe', 'pipe']
          });
          return 'running';
        } catch {
          return 'stopped';
        }
      }
      return 'stopped';
    }

    return 'stopped';
  } catch (error) {
    spinner.fail('檢查狀態失敗');
    if (error instanceof Error) {
      throw new ValidationError(`檢查狀態失敗: ${error.message}`);
    }
    throw new ValidationError('檢查狀態時發生未知錯誤');
  } finally {
    spinner.stop();
  }
};

/**
 * Get all servers status
 */
export const getAllServersStatus = async (): Promise<Array<{ name: string; status: ServerStatus }>> => {
  const spinner = ora('正在檢查所有伺服器狀態...').start();

  try {
    const config = await getGlobalConfig();
    if (!config.servers) {
      return [];
    }

    const servers = Object.entries(config.servers).map(([name]) => serverInfoSchema.parse({ ...config.servers[name], name }));
    const statuses = await Promise.all(
      servers.map(async (server) => ({
        name: server.name,
        status: await getServerStatus(server.name)
      }))
    );

    spinner.succeed('檢查完成');
    return statuses;
  } catch (error) {
    spinner.fail('檢查狀態失敗');
    if (error instanceof Error) {
      throw new ValidationError(`檢查狀態失敗: ${error.message}`);
    }
    throw new ValidationError('檢查狀態時發生未知錯誤');
  }
};

/**
 * Display server status
 */
export const displayServerStatus = async (name: string): Promise<void> => {
  const status = await getServerStatus(name);
  console.log(boxen(
    `伺服器 ${kleur.green(name)} 狀態: ${kleur.yellow(status)}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: status === 'running' ? 'green' : 'red'
    }
  ));
};

/**
 * Display all servers status
 */
export const displayAllServersStatus = async (): Promise<void> => {
  const statuses = await getAllServersStatus();
  console.log(boxen(
    statuses.map(({ name, status }) => 
      `伺服器 ${kleur.green(name)}: ${kleur.yellow(status)}`
    ).join('\n'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'blue'
    }
  ));
};

export default {
  getServerStatus,
  getAllServersStatus,
  displayServerStatus,
  displayAllServersStatus
}; 