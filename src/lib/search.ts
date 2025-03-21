/**
 * MCP Server Search Module
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { SearchError } from './errors.js';

const execAsync = promisify(exec);

/**
 * NPM package search result
 */
interface NpmSearchResult {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
}

/**
 * Search result interface
 */
export interface SearchResult {
  readonly name: string;
  readonly version: string;
  readonly description: string;
}

/**
 * Search configuration
 */
const SEARCH_CONFIG = {
  PREFIX: 'mcp-',
  NO_RESULTS_ERROR: 'No matches found',
  DEFAULT_DESCRIPTION: '',
  INDENT_SIZE: 3
} as const;

/**
 * Format package as search result
 */
const formatPackage = (pkg: NpmSearchResult): SearchResult => ({
  name: pkg.name,
  version: pkg.version,
  description: pkg.description ?? SEARCH_CONFIG.DEFAULT_DESCRIPTION
});

/**
 * Format server entry for display
 */
const formatServerEntry = (server: SearchResult, index: number): string => {
  const header = `${index + 1}. ${server.name} (v${server.version})`;
  return server.description
    ? `${header}\n${' '.repeat(SEARCH_CONFIG.INDENT_SIZE)}${server.description}`
    : header;
};

/**
 * Search for MCP servers
 * @throws {SearchError} If search fails
 */
export const searchServers = async (keyword: string): Promise<SearchResult[]> => {
  try {
    // Search npm registry
    const searchCmd = `npm search --json --no-description "${SEARCH_CONFIG.PREFIX}${keyword}"`;
    const { stdout } = await execAsync(searchCmd);
    
    // Parse and format results
    const searchResults = JSON.parse(stdout) as NpmSearchResult[];
    return searchResults.map(formatPackage);
  } catch (error) {
    // Handle no results case
    if ((error as { stderr?: string }).stderr?.includes(SEARCH_CONFIG.NO_RESULTS_ERROR)) {
      return [];
    }
    
    // Handle other errors
    throw new SearchError(
      'Failed to search for MCP servers',
      error instanceof Error ? error : new Error(String(error))
    );
  }
};

/**
 * Format search results for display
 */
export const formatSearchResults = (servers: SearchResult[]): string =>
  servers.length === 0
    ? 'No matching servers found'
    : servers.map(formatServerEntry).join('\n');

// Export as named exports for better tree-shaking
export { searchServers as default }; 