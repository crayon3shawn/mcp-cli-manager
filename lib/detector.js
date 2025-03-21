/**
 * MCP 伺服器偵測模組
 * 
 * 此模組負責:
 * 1. 掃描系統中已安裝的 MCP 伺服器
 * 2. 從各個客戶端的配置文件中提取伺服器信息
 * 3. 檢查常見的安裝位置
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const config = require('./config');

const execAsync = util.promisify(exec);

/**
 * 從文件讀取 JSON 配置
 * @param {string} filePath - 配置文件路徑
 * @returns {Promise<Object>} - 解析後的配置對象
 */
async function readJsonConfig(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`讀取配置文件失敗: ${filePath}`, error.message);
    }
    return null;
  }
}

/**
 * 從配置文件中提取 MCP 伺服器信息
 * @param {Object} config - 配置對象
 * @param {string} clientName - 客戶端名稱
 * @param {string} configPath - 配置文件路徑
 * @returns {Array<Object>} - 伺服器信息數組
 */
function extractServersFromConfig(config, clientName, configPath) {
  const servers = [];
  
  if (!config || !config.mcpServers) {
    return servers;
  }
  
  for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
    const serverInfo = {
      name: serverName,
      client: clientName,
      configPath: configPath,
      command: serverConfig.command,
      args: serverConfig.args || [],
      env: serverConfig.env || {},
      type: determineServerType(serverConfig.command, serverConfig.args || [])
    };
    
    servers.push(serverInfo);
  }
  
  return servers;
}

/**
 * 確定伺服器的類型
 * @param {string} command - 命令或路徑
 * @param {Array<string>} args - 參數列表
 * @returns {string} - 伺服器類型
 */
function determineServerType(command, args) {
  if (command === 'npx') {
    return 'npx';
  } else if (command.startsWith('/') || command.includes('\\')) {
    return 'binary';
  } else {
    return 'command';
  }
}

/**
 * 在指定的目錄中查找 MCP 相關的執行檔
 * @param {string} directory - 要搜索的目錄
 * @returns {Promise<Array<string>>} - 找到的執行檔路徑列表
 */
async function findMcpBinaries(directory) {
  try {
    const { stdout } = await execAsync(`find "${directory}" -name "mcp-*" -type f 2>/dev/null || echo ""`);
    return stdout.trim() ? stdout.trim().split('\n') : [];
  } catch (error) {
    return [];
  }
}

/**
 * 掃描系統中已安裝的 MCP 伺服器
 * @returns {Promise<Array<Object>>} - 伺服器信息數組
 */
async function detectInstalledServers() {
  const servers = [];
  
  // 1. 從配置文件中讀取
  const configPaths = config.getConfigPaths();
  for (const [clientName, configPath] of Object.entries(configPaths)) {
    const configData = await readJsonConfig(configPath);
    if (configData) {
      const clientServers = extractServersFromConfig(configData, clientName, configPath);
      servers.push(...clientServers);
    }
  }
  
  // 2. 檢查常見的安裝位置
  const binaryDirs = config.getBinaryDirs();
  for (const dir of binaryDirs) {
    const binaries = await findMcpBinaries(dir);
    for (const binary of binaries) {
      const name = path.basename(binary);
      
      // 檢查是否已經在配置文件中找到了
      const exists = servers.some(s => 
        s.command === binary || 
        (s.type === 'binary' && s.name === name)
      );
      
      if (!exists) {
        servers.push({
          name,
          client: 'system',
          configPath: null,
          command: binary,
          args: [],
          env: {},
          type: 'binary'
        });
      }
    }
  }
  
  return servers;
}

module.exports = {
  detectInstalledServers,
  readJsonConfig,
  extractServersFromConfig,
  findMcpBinaries
}; 