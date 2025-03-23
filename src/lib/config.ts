/**
 * MCP Configuration Management Module
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { readJson, writeJson } from './fs/json.js';
import { configPaths, ENV } from './config/paths.js';
import { globalConfigMigrator } from './config/version.js';
import { ConfigError } from './errors.js';
import type { GlobalConfig, VersionedConfig, ServerInfo } from './types.js';
import { globalConfigSchema, versionedConfigSchema } from './schemas.js';

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
    const configPath = configPaths.getPath('global');
    const config = await readJson<VersionedConfig<GlobalConfig>>(configPath);
    
    // Initialize default config if none exists
    if (!config) {
      const defaultConfig: GlobalConfig = {
        servers: {}
      };
      await saveGlobalConfig(defaultConfig);
      return defaultConfig;
    }
    
    // Validate config structure
    const versionedSchema = versionedConfigSchema(globalConfigSchema);
    const validatedConfig = versionedSchema.parse(config);

    // Check if migration is needed
    if (globalConfigMigrator.needsMigration(validatedConfig.version)) {
      const migratedConfig = await globalConfigMigrator.migrate(
        validatedConfig.data,
        validatedConfig.version
      );
      
      // Save migrated config
      await saveGlobalConfig(migratedConfig);
      return migratedConfig;
    }

    // Convert mcpServers to servers if needed
    if (validatedConfig.data.mcpServers && !validatedConfig.data.servers) {
      validatedConfig.data.servers = validatedConfig.data.mcpServers;
    }

    // Ensure servers property exists
    if (!validatedConfig.data.servers) {
      validatedConfig.data.servers = {};
    }

    return validatedConfig.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new ConfigError(`Failed to read global config: ${error.message}`, error);
    }
    throw error;
  }
}

/**
 * Save global configuration
 */
export async function saveGlobalConfig(config: GlobalConfig): Promise<void> {
  try {
    const configPath = configPaths.getPath('global');
    const versionedConfig: VersionedConfig<GlobalConfig> = {
      version: globalConfigMigrator.getCurrentVersion(),
      data: config
    };

    // Validate config before saving
    const versionedSchema = versionedConfigSchema(globalConfigSchema);
    versionedSchema.parse(versionedConfig);

    await writeJson(configPath, versionedConfig);
  } catch (error) {
    if (error instanceof Error) {
      throw new ConfigError(`Failed to save global config: ${error.message}`, error);
    }
    throw error;
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