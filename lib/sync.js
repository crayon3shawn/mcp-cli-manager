/**
 * MCP 伺服器同步模組
 */

import { CONFIG_PATHS, readJsonConfig, writeJsonConfig } from './config.js';

/**
 * 同步全局配置到 Cursor
 * @returns {Promise<void>}
 */
export async function syncCursorServers() {
  // 讀取全局配置
  const globalConfig = await readJsonConfig(CONFIG_PATHS.global) || { mcpServers: {} };
  
  // 讀取 Cursor 配置
  const cursorConfig = await readJsonConfig(CONFIG_PATHS.cursor) || { mcpServers: {} };
  
  // 合併配置
  cursorConfig.mcpServers = {
    ...cursorConfig.mcpServers,
    ...globalConfig.mcpServers
  };
  
  // 寫入配置文件
  await writeJsonConfig(CONFIG_PATHS.cursor, cursorConfig);
}

export default {
  syncCursorServers
}; 