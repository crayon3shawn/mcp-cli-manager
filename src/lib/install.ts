/**
 * MCP Server Installation Module
 */

import { execa, type ExecaReturnValue } from 'execa';
import kleur from 'kleur';
import boxen from 'boxen';
import ora from 'ora';
import { getGlobalConfig, saveGlobalConfig } from './config.ts';
import { ServerInfo, ServerTypeLiterals, type ServerType, type Connection } from './types.ts';
import { ValidationError } from './errors.ts';
import { serverInfoSchema, windsurfConfigSchema, clineConfigSchema } from './schemas.ts';

/**
 * Install server options
 */
interface ServerOptions {
  connection: Connection;
}

/**
 * Install a server
 */
export const installServer = async (
  name: string,
  type: ServerType,
  connection: Connection
): Promise<ServerInfo> => {
  const spinner = ora('正在安裝伺服器...').start();

  try {
    // Validate server info
    const serverInfo: ServerInfo = {
      name,
      type,
      connection
    };
    
    serverInfoSchema.parse(serverInfo);

    // Validate configuration based on server type
    if (type === ServerTypeLiterals.WINDSURF) {
      if (!connection.config) {
        throw new Error('無效的配置');
      }
      try {
        windsurfConfigSchema.parse(connection.config);
      } catch (error) {
        throw new Error('無效的配置');
      }
    } else if (type === ServerTypeLiterals.CLINE) {
      if (!connection.config) {
        throw new Error('無效的配置');
      }
      try {
        clineConfigSchema.parse(connection.config);
      } catch (error) {
        throw new Error('無效的配置');
      }
    }

    // Install package if it's an npx type
    if (type === ServerTypeLiterals.NPX) {
      spinner.text = `正在安裝 ${kleur.blue(name)}...`;
      try {
        const { stdout, stderr } = await execa('npm', ['install', '-g', name], {
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'buffer'
        });
        
        if (stderr) {
          console.warn(kleur.yellow(stderr.toString()));
        }
      } catch (error: unknown) {
        spinner.fail('安裝失敗');
        if (error instanceof Error) {
          throw new ValidationError(`安裝 ${name} 失敗: ${error.message}`);
        } else {
          throw new ValidationError(`安裝 ${name} 失敗: 未知錯誤`);
        }
      }
    }

    // Update global config
    spinner.text = '正在更新配置...';
    const globalConfig = await getGlobalConfig();
    if (!globalConfig.servers) {
      globalConfig.servers = {};
    }
    globalConfig.servers[name] = serverInfo;
    await saveGlobalConfig(globalConfig);

    spinner.succeed('安裝成功');
    console.log(boxen(
      `成功安裝伺服器 ${kleur.green(name)}\n` +
      `類型: ${kleur.blue(type)}\n` +
      `連接類型: ${kleur.yellow(connection.type)}`,
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
      spinner.text = `正在移除 ${kleur.blue(server.name)}...`;
      await execa('npm', ['uninstall', '-g', server.name], {
        stdio: 'inherit',
        encoding: 'buffer'
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