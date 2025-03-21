/**
 * MCP 伺服器安裝模組
 * 
 * 此模組負責:
 * 1. 安裝新的 MCP 伺服器
 * 2. 更新現有伺服器
 * 3. 卸載伺服器
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const { readJsonConfig, CLIENT_CONFIG_PATHS } = require('./detector');

const execAsync = util.promisify(exec);

/**
 * 已知的 MCP 伺服器安裝命令
 */
const KNOWN_SERVERS = {
  'github': {
    install: 'npm install -g mcp-server-github',
    command: 'mcp-server-github',
    type: 'binary'
  },
  'package-version': {
    install: 'npx -y mcp-package-version',
    command: 'npx',
    args: ['-y', 'mcp-package-version'],
    type: 'npx'
  },
  'bedrock': {
    install: 'npm install -g mcp-bedrock',
    command: 'mcp-bedrock',
    type: 'binary'
  }
};

/**
 * 使用 smithery 工具安裝 MCP 伺服器
 * @param {string} serverName - 伺服器名稱
 * @param {string} clientName - 客戶端名稱
 * @returns {Promise<Object>} - 安裝結果
 */
async function installServerWithSmithery(serverName, clientName) {
  try {
    const command = `npx -y @smithery/cli install ${serverName} --client ${clientName}`;
    const { stdout, stderr } = await execAsync(command);
    
    return {
      success: true,
      command,
      stdout,
      stderr
    };
  } catch (error) {
    return {
      success: false,
      error: `使用 smithery 安裝伺服器 '${serverName}' 失敗: ${error.message}`
    };
  }
}

/**
 * 使用預定義命令安裝伺服器
 * @param {string} serverName - 伺服器名稱
 * @returns {Promise<Object>} - 安裝結果
 */
async function installServerWithCommand(serverName) {
  if (!KNOWN_SERVERS[serverName]) {
    return {
      success: false,
      error: `未知的伺服器 '${serverName}'，無法安裝`
    };
  }
  
  try {
    const { install: command } = KNOWN_SERVERS[serverName];
    const { stdout, stderr } = await execAsync(command);
    
    return {
      success: true,
      command,
      stdout,
      stderr
    };
  } catch (error) {
    return {
      success: false,
      error: `安裝伺服器 '${serverName}' 失敗: ${error.message}`
    };
  }
}

/**
 * 更新 MCP 客戶端配置文件
 * @param {string} clientName - 客戶端名稱
 * @param {string} serverName - 伺服器名稱
 * @param {Object} serverConfig - 伺服器配置
 * @returns {Promise<Object>} - 操作結果
 */
async function updateClientConfig(clientName, serverName, serverConfig) {
  if (!CLIENT_CONFIG_PATHS[clientName]) {
    return {
      success: false,
      error: `未知的客戶端: '${clientName}'`
    };
  }
  
  const configPath = CLIENT_CONFIG_PATHS[clientName];
  
  try {
    // 讀取現有配置
    let config = await readJsonConfig(configPath);
    
    if (!config) {
      // 如果配置文件不存在，創建一個新的
      config = { mcpServers: {} };
    } else if (!config.mcpServers) {
      // 如果 mcpServers 屬性不存在，創建一個新的
      config.mcpServers = {};
    }
    
    // 更新伺服器配置
    config.mcpServers[serverName] = serverConfig;
    
    // 寫入配置文件
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    
    return {
      success: true,
      message: `已更新客戶端 '${clientName}' 的配置文件`,
      configPath
    };
  } catch (error) {
    return {
      success: false,
      error: `更新客戶端配置失敗: ${error.message}`
    };
  }
}

/**
 * 從客戶端配置中移除伺服器
 * @param {string} clientName - 客戶端名稱
 * @param {string} serverName - 伺服器名稱
 * @returns {Promise<Object>} - 操作結果
 */
async function removeServerFromClientConfig(clientName, serverName) {
  if (!CLIENT_CONFIG_PATHS[clientName]) {
    return {
      success: false,
      error: `未知的客戶端: '${clientName}'`
    };
  }
  
  const configPath = CLIENT_CONFIG_PATHS[clientName];
  
  try {
    // 讀取現有配置
    const config = await readJsonConfig(configPath);
    
    if (!config || !config.mcpServers || !config.mcpServers[serverName]) {
      return {
        success: false,
        error: `在客戶端 '${clientName}' 的配置中找不到伺服器 '${serverName}'`
      };
    }
    
    // 移除伺服器配置
    delete config.mcpServers[serverName];
    
    // 寫入配置文件
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    
    return {
      success: true,
      message: `已從客戶端 '${clientName}' 的配置中移除伺服器 '${serverName}'`,
      configPath
    };
  } catch (error) {
    return {
      success: false,
      error: `移除伺服器配置失敗: ${error.message}`
    };
  }
}

/**
 * 安裝 MCP 伺服器
 * @param {string} serverName - 伺服器名稱
 * @param {Object} options - 安裝選項
 * @param {string} options.client - 客戶端名稱
 * @param {boolean} options.useSmithery - 是否使用 smithery 工具安裝
 * @param {Object} options.env - 環境變量
 * @returns {Promise<Object>} - 安裝結果
 */
async function installServer(serverName, options = {}) {
  const { client = 'cursor', useSmithery = false, env = {} } = options;
  
  // 安裝伺服器
  const installResult = useSmithery
    ? await installServerWithSmithery(serverName, client)
    : await installServerWithCommand(serverName);
  
  if (!installResult.success) {
    return installResult;
  }
  
  // 如果是已知的伺服器，更新客戶端配置
  if (KNOWN_SERVERS[serverName]) {
    const { command, args = [], type } = KNOWN_SERVERS[serverName];
    
    const serverConfig = {
      command,
      args,
      env
    };
    
    const configResult = await updateClientConfig(client, serverName, serverConfig);
    
    return {
      ...installResult,
      configResult
    };
  }
  
  return installResult;
}

/**
 * 卸載 MCP 伺服器
 * @param {string} serverName - 伺服器名稱
 * @param {Object} options - 卸載選項
 * @param {string} options.client - 客戶端名稱
 * @param {boolean} options.removeConfig - 是否從客戶端配置中移除
 * @returns {Promise<Object>} - 卸載結果
 */
async function uninstallServer(serverName, options = {}) {
  const { client = 'cursor', removeConfig = true } = options;
  
  let uninstallResult = {
    success: true,
    message: `已嘗試卸載伺服器 '${serverName}'`
  };
  
  // 如果是已知的伺服器，嘗試卸載
  if (KNOWN_SERVERS[serverName] && KNOWN_SERVERS[serverName].type === 'binary') {
    try {
      const command = `npm uninstall -g ${KNOWN_SERVERS[serverName].command}`;
      const { stdout, stderr } = await execAsync(command);
      
      uninstallResult = {
        success: true,
        command,
        stdout,
        stderr
      };
    } catch (error) {
      uninstallResult = {
        success: false,
        error: `卸載伺服器 '${serverName}' 失敗: ${error.message}`
      };
    }
  }
  
  // 如果需要從客戶端配置中移除
  if (removeConfig) {
    const configResult = await removeServerFromClientConfig(client, serverName);
    
    return {
      ...uninstallResult,
      configResult
    };
  }
  
  return uninstallResult;
}

module.exports = {
  installServer,
  uninstallServer,
  updateClientConfig,
  removeServerFromClientConfig,
  installServerWithSmithery,
  installServerWithCommand,
  KNOWN_SERVERS
}; 