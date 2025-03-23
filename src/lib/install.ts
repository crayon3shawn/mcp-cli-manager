/**
 * MCP Server Installation Module
 */

import { execa } from 'execa';
import kleur from 'kleur';
import boxen from 'boxen';
import ora from 'ora';
import { getGlobalConfig, saveGlobalConfig } from './config.js';
import { ServerInfo, ServerTypeLiterals, type ServerType } from './types.js';
import { ValidationError } from './errors.js';
import { serverInfoSchema } from './schemas.js';

/**
 * Install server options
 */
interface ServerOptions {
  env?: Record<string, string>;
  args?: string[];
}

/**
 * Install a server
 */
export const installServer = async (
  name: string,
  type: ServerType,
  args: string[] = [],
  env: Record<string, string> = {}
): Promise<ServerInfo> => {
  const spinner = ora('正在安裝伺服器...').start();

  try {
    // Validate server info
    const serverInfo: ServerInfo = {
      name,
      type,
      command: name,
      env,
      args
    };
    
    serverInfoSchema.parse(serverInfo);

    // Install package if it's an npx type
    if (type === ServerTypeLiterals.NPX) {
      spinner.text = `正在安裝 ${kleur.blue(name)}...`;
      await execa('npm', ['install', '-g', name], {
        stdio: 'inherit'
      });
    }

    // Update global config
    spinner.text = '正在更新配置...';
    const config = await getGlobalConfig();
    if (!config.servers) {
      config.servers = {};
    }
    config.servers[name] = serverInfo;
    await saveGlobalConfig(config);

    spinner.succeed('安裝成功');
    console.log(boxen(
      `成功安裝伺服器 ${kleur.green(name)}\n` +
      `類型: ${kleur.blue(type)}\n` +
      `命令: ${kleur.yellow(name)}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));

    return serverInfo;
  } catch (error) {
    spinner.fail('安裝失敗');
    if (error instanceof Error) {
      throw new ValidationError(`安裝失敗: ${error.message}`);
    }
    throw new ValidationError('安裝時發生未知錯誤');
  }
};

/**
 * Get server info
 */
export const getServerInfo = async (name: string): Promise<ServerInfo | null> => {
  try {
    const config = await getGlobalConfig();
    if (!config.servers) {
      return null;
    }
    const server = config.servers[name];
    
    if (!server) {
      return null;
    }

    return serverInfoSchema.parse(server);
  } catch (error) {
    if (error instanceof Error) {
      throw new ValidationError(`獲取伺服器資訊失敗: ${error.message}`);
    }
    throw new ValidationError('獲取伺服器資訊時發生未知錯誤');
  }
};

/**
 * Get all installed servers
 */
export const getInstalledServers = async (): Promise<ServerInfo[]> => {
  try {
    const config = await getGlobalConfig();
    if (!config.servers) {
      return [];
    }
    return Object.values(config.servers).map(server => serverInfoSchema.parse(server));
  } catch (error) {
    if (error instanceof Error) {
      throw new ValidationError(`獲取已安裝伺服器列表失敗: ${error.message}`);
    }
    throw new ValidationError('獲取已安裝伺服器列表時發生未知錯誤');
  }
};

/**
 * Uninstall a server
 */
export const uninstallServer = async (name: string): Promise<void> => {
  const spinner = ora('正在移除伺服器...').start();

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

    // Uninstall package if it's an npx type
    if (server.type === ServerTypeLiterals.NPX) {
      spinner.text = `正在移除 ${kleur.blue(server.command)}...`;
      await execa('npm', ['uninstall', '-g', server.command], {
        stdio: 'inherit'
      });
    }

    // Remove from config
    spinner.text = '正在更新配置...';
    delete config.servers[name];
    await saveGlobalConfig(config);

    spinner.succeed('移除成功');
    console.log(boxen(
      `成功移除伺服器 ${kleur.green(name)}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));
  } catch (error) {
    spinner.fail('移除失敗');
    if (error instanceof Error) {
      throw new ValidationError(`移除失敗: ${error.message}`);
    }
    throw new ValidationError('移除時發生未知錯誤');
  }
};

export default {
  installServer,
  getServerInfo,
  getInstalledServers,
  uninstallServer
}; 