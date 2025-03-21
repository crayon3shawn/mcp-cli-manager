/**
 * MCP Server Synchronization Module
 */

import { CONFIG_PATHS, readJsonConfig, writeJsonConfig } from './config.js';

/**
 * Synchronize global configuration to Cursor
 * @returns {Promise<void>}
 */
export async function syncCursorServers() {
  // Read global configuration
  const globalConfig = await readJsonConfig(CONFIG_PATHS.global) || { mcpServers: {} };
  
  // Read Cursor configuration
  const cursorConfig = await readJsonConfig(CONFIG_PATHS.cursor) || { mcpServers: {} };
  
  // Merge configurations
  cursorConfig.mcpServers = {
    ...cursorConfig.mcpServers,
    ...globalConfig.mcpServers
  };
  
  // Write configuration file
  await writeJsonConfig(CONFIG_PATHS.cursor, cursorConfig);
}

export default {
  syncCursorServers
}; 