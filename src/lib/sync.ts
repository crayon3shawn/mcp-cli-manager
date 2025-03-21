/**
 * MCP Server Synchronization Module
 */

import { readJson, writeJson } from './fs/json.js';
import { configPaths } from './config/paths.js';
import { ConfigError } from './errors.js';
import type { GlobalConfig, TargetApp } from './types.js';

/**
 * Synchronize global configuration to target application
 */
export const syncConfig = async (target: TargetApp = 'cursor'): Promise<void> => {
  try {
    // Read global configuration with default empty servers
    const globalConfig = await readJson<GlobalConfig>(configPaths.getPath('global')) ?? {
      mcpServers: {} as const
    };

    // Create new target configuration preserving immutability
    const targetConfig: GlobalConfig = {
      mcpServers: { ...globalConfig.mcpServers }
    };

    // Get target config path
    const targetPath = configPaths.getPath(target === 'claude-desktop' ? 'claudeDesktop' : target);
    if (!targetPath) {
      throw new ConfigError(`Unsupported target application: ${target}`);
    }

    // Write configuration file
    await writeJson(targetPath, targetConfig);
    console.log(`Configuration synchronized to ${target}`);
  } catch (error) {
    throw new ConfigError(`Failed to synchronize configuration to ${target}`, error);
  }
};

/**
 * Synchronize global configuration to Cursor (legacy support)
 */
export const syncCursorServers = (): Promise<void> => syncConfig('cursor');

/**
 * Synchronize global configuration to Claude Desktop
 */
export const syncClaudeDesktopServers = (): Promise<void> => syncConfig('claude-desktop');

// Export as named exports for better tree-shaking
export { syncConfig as default }; 