/**
 * MCP Server Search Module Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { searchServers, formatSearchResults } from '../search.js'
import { SearchResult } from '../types.js'
import npmRegistryFetch from 'npm-registry-fetch'

vi.mock('npm-registry-fetch', () => ({
  default: {
    json: vi.fn()
  }
}))

describe('Search Module', () => {
  const mockNpmResult = {
    objects: [
      {
        package: {
          name: 'test-server',
          version: '1.0.0',
          description: 'A test server',
          author: {
            name: 'Test Author'
          },
          date: '2024-03-27'
        }
      }
    ]
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('searchServers', () => {
    it('should return search results', async () => {
      vi.mocked(npmRegistryFetch.json).mockResolvedValueOnce(mockNpmResult)

      const results = await searchServers('test')
      expect(results).toEqual([
        {
          name: 'test-server',
          version: '1.0.0',
          description: 'A test server',
          author: 'Test Author',
          lastUpdated: '2024-03-27'
        }
      ])
    })

    it('should handle empty results', async () => {
      vi.mocked(npmRegistryFetch.json).mockResolvedValueOnce({ objects: [] })

      const results = await searchServers('test')
      expect(results).toEqual([])
    })

    it('should handle search error', async () => {
      vi.mocked(npmRegistryFetch.json).mockRejectedValueOnce(new Error('Search failed'))

      await expect(searchServers('test')).rejects.toThrow('搜尋失敗: Search failed')
    })
  })

  describe('formatSearchResults', () => {
    it('should format search results', () => {
      const results: SearchResult[] = [
        {
          name: 'test-server',
          version: '1.0.0',
          description: 'A test server',
          author: 'Test Author',
          lastUpdated: '2024-03-27'
        }
      ]

      const formatted = formatSearchResults(results)
      expect(formatted).toContain('test-server')
      expect(formatted).toContain('1.0.0')
      expect(formatted).toContain('A test server')
      expect(formatted).toContain('Test Author')
      expect(formatted).toContain('2024-03-27')
    })

    it('should handle empty results', () => {
      const formatted = formatSearchResults([])
      expect(formatted).toContain('未找到相關的 MCP 伺服器')
    })
  })
}) 