/**
 * MCP Configuration Sync Module
 */

import { getGlobalConfig, saveGlobalConfig } from './config.js';
import { readJson, writeJson } from './fs/json.js';
import { configPaths } from './config/paths.js';
import type { GlobalConfig, TargetApp, ConfigPaths } from './types.js';
import { ValidationError } from './errors.js';

/**
 * Convert target app to config path key
 */
function getConfigPathKey(target: TargetApp): 'cursor' | 'claudeDesktop' {
  return target === 'claude-desktop' ? 'claudeDesktop' : 'cursor';
}

/**
 * Sync configuration with target application
 */
export async function syncConfig(target: TargetApp): Promise<void> {
  try {
    const globalConfig = await getGlobalConfig();
    const targetPath = configPaths.getPath(getConfigPathKey(target));

    // Read target config
    const targetConfig = await readJson<GlobalConfig>(targetPath) || { servers: {} };

    // Write back to target
    await writeJson(targetPath, targetConfig);
  } catch (error) {
    if (error instanceof Error) {
      throw new ValidationError(`同步失敗: ${error.message}`);
    }
    throw new ValidationError('同步時發生未知錯誤');
  }
}

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