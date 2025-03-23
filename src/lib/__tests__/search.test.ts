/**
 * MCP Server Search Module Tests
 */

import { jest, type Mock } from '@jest/globals';
import { searchServers, formatSearchResults } from '../search.js';
import { SearchResult } from '../types.js';
import type { SearchResult as NpmSearchResult } from 'npm-registry-fetch';

// Mock npm-registry-fetch
const mockSearch = jest.fn();
jest.mock('npm-registry-fetch', () => ({
  __esModule: true,
  default: {
    search: mockSearch
  }
}));

describe('Search Module', () => {
  const mockSearchResult: SearchResult = {
    name: 'mcp-test-server',
    version: '1.0.0',
    description: 'Test server description',
    author: 'Test Author',
    lastUpdated: '2024-03-27'
  };

  const mockNpmResult: NpmSearchResult = {
    name: 'mcp-test-server',
    version: '1.0.0',
    description: 'Test server description',
    author: { name: 'Test Author' },
    date: '2024-03-27'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchServers', () => {
    it('should return search results when successful', async () => {
      mockSearch.mockResolvedValueOnce([mockNpmResult]);

      const results = await searchServers('test');
      expect(results).toEqual([mockSearchResult]);
    });

    it('should handle empty search results', async () => {
      mockSearch.mockResolvedValueOnce([]);

      const results = await searchServers('nonexistent');
      expect(results).toEqual([]);
    });

    it('should handle search errors', async () => {
      mockSearch.mockRejectedValueOnce(new Error('Search failed'));

      await expect(searchServers('test')).rejects.toThrow('搜尋失敗');
    });
  });

  describe('formatSearchResults', () => {
    it('should format search results correctly', () => {
      const results = [mockSearchResult];
      const formatted = formatSearchResults(results);
      expect(formatted).toContain('mcp-test-server');
      expect(formatted).toContain('1.0.0');
      expect(formatted).toContain('Test server description');
      expect(formatted).toContain('Test Author');
      expect(formatted).toContain('2024-03-27');
    });

    it('should handle empty results', () => {
      const formatted = formatSearchResults([]);
      expect(formatted).toContain('未找到相關的 MCP 伺服器');
    });
  });
}); 