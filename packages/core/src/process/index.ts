/**
 * MCP Server Process Management Module
 */

import { execa, type ExecaChildProcess } from 'execa';
import { ServerTypeLiterals, ConnectionTypeLiterals, type ServerInfo, type Connection, type ServerStatus } from './types.js';
import { ValidationError } from './errors.js';
import { serverInfoSchema } from './schemas.js';
import { getGlobalConfig, saveGlobalConfig } from './config.js';
import ora from 'ora';
import kleur from 'kleur';
import boxen from 'boxen';

// Store running processes
export const runningProcesses = new Map<string, {
  process: ExecaChildProcess;
  startTime: string;
}>();

/**
 * Start a server
 */
export const startServer = async (name: string): Promise<void> => {
  const spinner = ora('正在啟動伺服器...').start();

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

    // Check if server is already running
    if (runningProcesses.has(name)) {
      spinner.fail('伺服器已在運行中');
      throw new ValidationError(`伺服器 ${name} 已在運行中`);
    }

    // Start server based on connection type
    let process: ExecaChildProcess;
    if (serverInfo.connection.type === ConnectionTypeLiterals.STDIO) {
      const stdioConnection = serverInfo.connection;
      process = execa(stdioConnection.command, stdioConnection.args || [], {
        env: stdioConnection.env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } else if (serverInfo.connection.type === ConnectionTypeLiterals.WS) {
      const wsConnection = serverInfo.connection;
      // For WebSocket connections, we need to start a proxy process
      // This is a placeholder - actual implementation will depend on the specific WebSocket server
      process = execa('node', ['-e', `
        const WebSocket = require('ws');
        const ws = new WebSocket('${wsConnection.url}');
        ws.on('open', () => {
          console.log('Connected to WebSocket server');
        });
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          process.exit(1);
        });
      `], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } else {
      throw new ValidationError(`不支援的連接類型: ${(serverInfo.connection as Connection).type}`);
    }

    // Store process info
    runningProcesses.set(name, {
      process,
      startTime: new Date().toISOString()
    });

    // Handle process events
    process.stdout?.on('data', (data) => {
      console.log(kleur.blue(`[${name}] ${data}`));
    });

    process.stderr?.on('data', (data) => {
      console.warn(kleur.yellow(`[${name}] ${data}`));
    });

    process.on('error', (error) => {
      console.error(kleur.red(`[${name}] 錯誤: ${error.message}`));
      runningProcesses.delete(name);
    });

    process.on('exit', (code) => {
      if (code !== 0) {
        console.error(kleur.red(`[${name}] 進程異常退出，退出碼: ${code}`));
      }
      runningProcesses.delete(name);
    });

    spinner.succeed('啟動成功');
    console.log(boxen(
      `成功啟動伺服器 ${kleur.green(name)}\n` +
      `類型: ${kleur.blue(serverInfo.type)}\n` +
      `連接類型: ${kleur.yellow(serverInfo.connection.type)}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));
  } catch (error) {
    spinner.fail('啟動失敗');
    if (error instanceof Error) {
      throw new ValidationError(`啟動失敗: ${error.message}`);
    }
    throw new ValidationError('啟動時發生未知錯誤');
  }
};

/**
 * Stop a server
 */
export const stopServer = async (name: string): Promise<void> => {
  const spinner = ora('正在停止伺服器...').start();

  try {
    const processInfo = runningProcesses.get(name);
    if (!processInfo) {
      spinner.fail('伺服器未運行');
      throw new ValidationError(`伺服器 ${name} 未運行`);
    }

    // Kill process
    processInfo.process.kill();
    runningProcesses.delete(name);

    spinner.succeed('停止成功');
    console.log(boxen(
      `成功停止伺服器 ${kleur.green(name)}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));
  } catch (error) {
    spinner.fail('停止失敗');
    if (error instanceof Error) {
      throw new ValidationError(`停止失敗: ${error.message}`);
    }
    throw new ValidationError('停止時發生未知錯誤');
  }
};

/**
 * Get server status
 */
export const getServerStatus = async (name: string): Promise<ServerStatus> => {
  const processInfo = runningProcesses.get(name);
  if (!processInfo) {
    return 'stopped';
  }

  try {
    // Check if process is still running
    processInfo.process.kill(0);
    return 'running';
  } catch {
    runningProcesses.delete(name);
    return 'stopped';
  }
};

/**
 * Get all running servers
 */
export const getRunningServers = async (): Promise<Array<{ name: string; status: ServerStatus; startTime: string }>> => {
  const servers = Array.from(runningProcesses.entries()).map(([name, info]) => ({
    name,
    status: 'running' as const,
    startTime: info.startTime
  }));

  return servers;
};

export default {
  startServer,
  stopServer,
  getServerStatus,
  getRunningServers
}; 