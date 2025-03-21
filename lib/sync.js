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
  
  // Create new Cursor configuration
  const cursorConfig = {
    mcpServers: { ...globalConfig.mcpServers }
  };
  
  // Write configuration file
  await writeJsonConfig(CONFIG_PATHS.cursor, cursorConfig);
}

export default {
  syncCursorServers
}; 