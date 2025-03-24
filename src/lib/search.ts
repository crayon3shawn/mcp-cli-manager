/**
 * MCP Server Search Module
 */

import kleur from 'kleur';
import boxen from 'boxen';
import npmRegistryFetch from 'npm-registry-fetch';
import { SearchResult, NpmSearchResult } from './types.js';
import { ValidationError } from './errors.js';

/**
 * Search for MCP servers
 */
export async function searchServers(query: string): Promise<SearchResult[]> {
  try {
    const searchQuery = query.startsWith('@modelcontextprotocol/server-')
      ? query.replace('@modelcontextprotocol/server-', '')
      : query;
    const response = await npmRegistryFetch.json(`/-/v1/search?text=@modelcontextprotocol/server-${searchQuery}`) as { objects: Array<{ package: NpmSearchResult }> };
    const objects = response.objects || [];

    return objects.map((obj: { package: NpmSearchResult }) => ({
      name: obj.package.name,
      version: obj.package.version,
      description: obj.package.description || '',
      author: obj.package.author?.name || 'Unknown',
      lastUpdated: obj.package.date || ''
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new ValidationError(`搜尋失敗: ${error.message}`);
    }
    throw new ValidationError('搜尋時發生未知錯誤');
  }
}

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

export default {
  searchServers
}; 