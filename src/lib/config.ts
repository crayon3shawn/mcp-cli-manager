/**
 * MCP Configuration Management Module
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readJson, writeJson } from './fs/json.js';
import { configPaths } from './config/paths.js';
import { globalConfigMigrator } from './config/version.js';
import { ConfigError } from './errors.js';
import type { GlobalConfig, VersionedConfig } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Server configuration interface
 */
export interface McpServer {
  type: 'npx' | 'binary';
  command: string;
  args: string[];
  env: Record<string, string>;
}

/**
 * Configuration paths interface
 */
export interface ConfigPaths {
  global: string;
  cursor: string;
  claude: string;
  claudeDesktop: string;
  vscode: string;
}

/**
 * Check if in development mode
 */
export const isDev: boolean = process.env.NODE_ENV === 'development';

/**
 * MCP configuration directory
 */
export const MCP_CONFIG_DIR: string = isDev 
  ? path.join(__dirname, '..', '..', 'dev-config') 
  : path.join(os.homedir(), '.cursor');

/**
 * MCP configuration file paths
 */
export const CONFIG_PATHS: ConfigPaths = {
  // Global configuration (same as cursor for now)
  global: isDev 
    ? path.join(__dirname, '..', '..', 'dev-config', 'mcp.json')
    : path.join(os.homedir(), '.cursor', 'mcp.json'),
  // Client configurations
  cursor: isDev 
    ? path.join(__dirname, '..', '..', 'dev-config', 'cursor.json')
    : path.join(os.homedir(), '.cursor', 'mcp.json'),
  claude: isDev
    ? path.join(__dirname, '..', '..', 'dev-config', 'claude.json')
    : path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  claudeDesktop: isDev
    ? path.join(__dirname, '..', '..', 'dev-config', 'claude-desktop.json')
    : path.join(os.homedir(), 'Library', 'Application Support', 'Claude-Desktop', 'config', 'mcp.json'),
  vscode: isDev
    ? path.join(__dirname, '..', '..', 'dev-config', 'vscode.json')
    : path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json')
};

/**
 * Ensure configuration directory exists
 */
export async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(MCP_CONFIG_DIR, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Read JSON configuration file
 * @param {string} filePath - Configuration file path
 * @returns {Promise<T|null>} - Configuration object or null
 */
export async function readJsonConfig<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(`Failed to read configuration file (${filePath}):`, (error as Error).message);
    }
    return null;
  }
}

/**
 * Write JSON configuration file
 * @param {string} filePath - Configuration file path
 * @param {T} data - Data to write
 * @returns {Promise<void>}
 */
export async function writeJsonConfig<T>(filePath: string, data: T): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Get global configuration
 */
export async function getGlobalConfig(): Promise<GlobalConfig> {
  try {
    const versionedConfig = await readJson<VersionedConfig<GlobalConfig>>(configPaths.getPath('global'));
    
    if (!versionedConfig) {
      // Create initial config with version 0
      const initialConfig: VersionedConfig<GlobalConfig> = {
        version: 0,
        data: { mcpServers: {} }
      };
      await saveGlobalConfig(initialConfig.data);
      return initialConfig.data;
    }

    // Check if migration is needed
    if (globalConfigMigrator.needsMigration(versionedConfig.version)) {
      const migratedConfig = await globalConfigMigrator.migrate(
        versionedConfig.data,
        versionedConfig.version
      );
      
      // Save migrated config
      await saveGlobalConfig(migratedConfig);
      return migratedConfig;
    }

    return versionedConfig.data;
  } catch (error) {
    throw new ConfigError('Failed to read global configuration', error);
  }
}

/**
 * Save global configuration
 */
export async function saveGlobalConfig(config: GlobalConfig): Promise<void> {
  try {
    const versionedConfig: VersionedConfig<GlobalConfig> = {
      version: globalConfigMigrator.getCurrentVersion(),
      data: config
    };
    
    await writeJson(configPaths.getPath('global'), versionedConfig, {
      spaces: 2,
      ensureDirectory: true
    });
  } catch (error) {
    throw new ConfigError('Failed to save global configuration', error);
  }
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