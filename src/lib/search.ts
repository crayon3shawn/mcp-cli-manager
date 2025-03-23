/**
 * MCP Server Search Module
 */

import kleur from 'kleur';
import boxen from 'boxen';
import npmRegistryFetch from 'npm-registry-fetch';
import { SearchResult } from './types.js';

/**
 * Search for MCP servers
 */
export const searchServers = async (query: string): Promise<SearchResult[]> => {
  try {
    const results = await npmRegistryFetch.search(`mcp-${query}`);
    
    return results.map((pkg: any) => ({
      name: pkg.name,
      version: pkg.version,
      description: pkg.description || 'No description available',
      author: pkg.author?.name || 'Unknown',
      lastUpdated: new Date(pkg.date).toLocaleDateString()
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`搜尋失敗: ${error.message}`);
    }
    throw new Error('搜尋時發生未知錯誤');
  }
};

/**
 * Format search results for display
 */
export const formatSearchResults = (results: SearchResult[]): string => {
  if (results.length === 0) {
    return boxen('未找到相關的 MCP 伺服器', {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'yellow'
    });
  }

  const formattedResults = results.map((result, index) => {
    const name = kleur.blue(result.name);
    const version = kleur.gray(`v${result.version}`);
    const author = kleur.gray(`by ${result.author}`);
    const date = kleur.gray(`updated ${result.lastUpdated}`);
    
    return [
      `${index + 1}. ${name} ${version}`,
      `   ${result.description}`,
      `   ${author} | ${date}`
    ].join('\n');
  });

  return boxen(formattedResults.join('\n\n'), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'blue'
  });
}; 