/**
 * MCP Configuration Management Module
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Check if in development mode
 */
export const isDev = process.env.NODE_ENV === 'development';

/**
 * MCP configuration directory
 */
export const MCP_CONFIG_DIR = isDev 
  ? path.join(__dirname, '..', 'dev-config') 
  : path.join(os.homedir(), '.cursor');

/**
 * MCP configuration file paths
 */
export const CONFIG_PATHS = {
  // Global configuration (same as cursor for now)
  global: isDev 
    ? path.join(__dirname, '..', 'dev-config', 'mcp.json')
    : path.join(os.homedir(), '.cursor', 'mcp.json'),
  // Client configurations
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
 * Ensure configuration directory exists
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
 * Read JSON configuration file
 * @param {string} filePath - Configuration file path
 * @returns {Promise<Object|null>} - Configuration object or null
 */
export async function readJsonConfig(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Failed to read configuration file (${filePath}):`, error.message);
    }
    return null;
  }
}

/**
 * Write JSON configuration file
 * @param {string} filePath - Configuration file path
 * @param {Object} data - Data to write
 * @returns {Promise<void>}
 */
export async function writeJsonConfig(filePath, data) {
  await ensureConfigDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Get global configuration
 * @returns {Promise<Object>} - Global configuration object
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
 * Save global configuration
 * @param {Object} config - Configuration object
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