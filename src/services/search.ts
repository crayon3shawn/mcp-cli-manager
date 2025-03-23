/**
 * Search functionality for MCP servers
 */

import { execSync } from 'child_process';
import { type SearchOptions, type SearchResult, type NpmSearchResult } from '../types.js';
import { SearchError } from '../utils/errors.js';
import { SEARCH_CONFIG } from '../utils/constants.js';

/**
 * Calculate match score for a package
 */
function calculateMatchScore(pkg: NpmSearchResult, query: string): number {
  const queryLower = query.toLowerCase();
  const nameLower = pkg.name.toLowerCase();
  const descriptionLower = pkg.description.toLowerCase();
  
  let score = 0;

  // Name match scoring
  if (nameLower === queryLower) {
    score += 100;  // Exact match
  } else if (nameLower.startsWith(queryLower)) {
    score += 80;   // Starts with
  } else if (nameLower.includes(queryLower)) {
    score += 60;   // Contains
  }

  // Description match scoring
  if (descriptionLower.includes(queryLower)) {
    score += 40;
  }

  // Keywords match scoring
  if (pkg.keywords?.some(keyword => keyword.toLowerCase().includes(queryLower))) {
    score += 20;
  }

  // Additional scoring factors
  if (pkg.version) {
    score += 10;  // Has version
  }
  if (pkg.description) {
    score += 5;   // Has description
  }

  return score;
}

/**
 * Check if a package is likely an MCP server
 */
function isMCPPackage(pkg: NpmSearchResult): boolean {
  const name = pkg.name.toLowerCase();
  const description = pkg.description.toLowerCase();
  
  // Check name patterns
  if (name.startsWith('mcp-') || 
      name.endsWith('-server') || 
      name.includes('mcp-server') ||
      name.includes('mcp-server')) {
    return true;
  }
  
  // Check description keywords
  const keywords = ['mcp', 'server', 'service', 'backend', 'api'];
  return keywords.some(keyword => 
    description.includes(keyword) || 
    pkg.keywords?.some(k => k.toLowerCase().includes(keyword))
  );
}

/**
 * Search for npm packages
 */
async function searchNpmPackages(query: string): Promise<NpmSearchResult[]> {
  try {
    // Try different search patterns
    const patterns = [
      query,  // Original query
      `mcp-${query}`,  // With mcp prefix
      `${query}-server`,  // With server suffix
      `mcp-server-${query}`  // With both
    ];
    
    const allResults = new Set<NpmSearchResult>();
    
    for (const pattern of patterns) {
      const result = execSync(`npm search ${pattern} --json`, {
        encoding: 'utf8'
      });
      const results = JSON.parse(result);
      results.forEach((pkg: NpmSearchResult) => allResults.add(pkg));
    }
    
    return Array.from(allResults);
  } catch (error) {
    throw new SearchError(`Failed to search npm packages: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Search for servers
 */
export async function searchServers(options: SearchOptions): Promise<SearchResult[]> {
  try {
    const { query } = options;
    
    // Search npm packages
    const npmResults = await searchNpmPackages(query);
    
    // Filter and convert to search results
    return npmResults
      .filter(isMCPPackage)
      .map(pkg => ({
        name: pkg.name,
        description: pkg.description,
        version: pkg.version,
        type: 'npx' as const,
        source: 'npm' as const,
        matchScore: calculateMatchScore(pkg, query),
        npmInfo: pkg
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    throw new SearchError(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
} 