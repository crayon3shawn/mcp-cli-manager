/**
 * MCP Server Search Module
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Search for MCP servers
 * @param {string} keyword - Search keyword
 * @returns {Promise<Array<Object>>} Search results
 */
export async function searchServers(keyword) {
  try {
    // Search npm registry
    const searchCmd = `npm search --json --no-description "mcp-${keyword}"`;
    const { stdout } = await execAsync(searchCmd);
    const searchResults = JSON.parse(stdout);

    // Format results
    return searchResults.map(pkg => ({
      name: pkg.name,
      version: pkg.version,
      description: pkg.description || ''
    }));
  } catch (error) {
    if (error.stderr?.includes('No matches found')) {
      return [];
    }
    throw new Error(`Search failed: ${error.message}`);
  }
}

/**
 * Format search results
 * @param {Array<Object>} servers - Search results
 * @returns {string} Formatted string
 */
export function formatSearchResults(servers) {
  if (servers.length === 0) {
    return 'No matching servers found';
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