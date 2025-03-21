/**
 * MCP 伺服器搜尋模組
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 搜尋 MCP 伺服器
 * @param {string} keyword - 搜尋關鍵字
 * @returns {Promise<Array<Object>>} 搜尋結果
 */
export async function searchServers(keyword) {
  try {
    // 搜尋 npm registry
    const searchCmd = `npm search --json --no-description "mcp-${keyword}"`;
    const { stdout } = await execAsync(searchCmd);
    const searchResults = JSON.parse(stdout);

    // 格式化結果
    return searchResults.map(pkg => ({
      name: pkg.name,
      version: pkg.version,
      description: pkg.description || ''
    }));
  } catch (error) {
    if (error.stderr?.includes('No matches found')) {
      return [];
    }
    throw new Error(`搜尋失敗：${error.message}`);
  }
}

/**
 * 格式化搜尋結果
 * @param {Array<Object>} servers - 搜尋結果
 * @returns {string} 格式化後的字串
 */
export function formatSearchResults(servers) {
  if (servers.length === 0) {
    return '找不到符合的伺服器';
  }

  return servers.map((server, index) => {
    let output = `${index + 1}. ${server.name} (v${server.version})`;
    if (server.description) {
      output += `\n   ${server.description}`;
    }
    return output;
  }).join('\n');
}

export default {
  searchServers,
  formatSearchResults
}; 