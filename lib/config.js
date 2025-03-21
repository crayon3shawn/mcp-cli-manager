/**
 * MCP 配置管理模組
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 判斷是否為開發模式
 */
export const isDev = process.env.NODE_ENV === 'development';

/**
 * MCP 配置目錄
 */
export const MCP_CONFIG_DIR = isDev 
  ? path.join(__dirname, '..', 'dev-config') 
  : path.join(os.homedir(), '.mcp');

/**
 * MCP 配置文件路徑
 */
export const CONFIG_PATHS = {
  // 全局配置
  global: path.join(MCP_CONFIG_DIR, 'config.json'),
  // 客戶端配置
  cursor: isDev 
    ? path.join(__dirname, '..', 'dev-config', 'cursor.json')
    : path.join(os.homedir(), '.cursor', 'mcp.json'),
  claude: isDev
    ? path.join(__dirname, '..', 'dev-config', 'claude.json')
    : path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  vscode: isDev
    ? path.join(__dirname, '..', 'dev-config', 'vscode.json')
    : path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json')
};

/**
 * 確保配置目錄存在
 */
export async function ensureConfigDir() {
  try {
    await fs.mkdir(MCP_CONFIG_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * 讀取 JSON 配置文件
 * @param {string} filePath - 配置文件路徑
 * @returns {Promise<Object|null>} - 配置對象或 null
 */
export async function readJsonConfig(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`讀取配置文件失敗 (${filePath}):`, error.message);
    }
    return null;
  }
}

/**
 * 寫入 JSON 配置文件
 * @param {string} filePath - 配置文件路徑
 * @param {Object} data - 要寫入的數據
 * @returns {Promise<void>}
 */
export async function writeJsonConfig(filePath, data) {
  await ensureConfigDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 獲取全局配置
 * @returns {Promise<Object>} - 全局配置對象
 */
export async function getGlobalConfig() {
  await ensureConfigDir();
  const config = await readJsonConfig(CONFIG_PATHS.global) || {};
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  return config;
}

/**
 * 保存全局配置
 * @param {Object} config - 配置對象
 * @returns {Promise<void>}
 */
export async function saveGlobalConfig(config) {
  await writeJsonConfig(CONFIG_PATHS.global, config);
}

export default {
  MCP_CONFIG_DIR,
  CONFIG_PATHS,
  ensureConfigDir,
  readJsonConfig,
  writeJsonConfig,
  getGlobalConfig,
  saveGlobalConfig
}; 