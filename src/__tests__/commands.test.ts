import { describe, it, expect } from 'vitest';
import { formatListResults, formatSearchResults } from '../utils/format.js';
import { type SearchResult, Status, Type, type ServerSource } from '../types.js';

describe('Command Output Formatting', () => {
  describe('formatListResults', () => {
    it('should format empty list correctly', () => {
      const output = formatListResults([], false);
      expect(output).toContain('No servers found');
    });

    it('should format basic list correctly', () => {
      const servers = [
        { name: 'test-server', status: Status.RUNNING, type: Type.NPX, source: 'npm' as ServerSource },
        { name: 'dev-server', status: Status.STOPPED, type: Type.NPX, source: 'npm' as ServerSource }
      ];
      const output = formatListResults(servers, false);
      
      expect(output).toContain('Installed servers:');
      expect(output).toContain('NAME');
      expect(output).toContain('STATUS');
      expect(output).toContain('test-server');
      expect(output).toContain('dev-server');
      expect(output).toContain('running');
      expect(output).toContain('stopped');
    });

    it('should format verbose list correctly', () => {
      const servers = [
        { 
          name: 'test-server', 
          status: Status.RUNNING,
          type: Type.NPX,
          source: 'npm' as ServerSource,
          pid: 1234,
          uptime: 3600
        },
        { 
          name: 'dev-server', 
          status: Status.STOPPED,
          type: Type.NPX,
          source: 'npm' as ServerSource,
          pid: undefined,
          uptime: undefined
        }
      ];
      const output = formatListResults(servers, true);
      
      expect(output).toContain('Installed servers:');
      expect(output).toContain('NAME');
      expect(output).toContain('TYPE');
      expect(output).toContain('PID');
      expect(output).toContain('STATUS');
      expect(output).toContain('UPTIME');
      expect(output).toContain('test-server');
      expect(output).toContain('dev-server');
      expect(output).toContain('running');
      expect(output).toContain('stopped');
      expect(output).toContain('1234');
      expect(output).toContain('1h');
      expect(output).toContain('N/A');
    });
  });

  describe('formatSearchResults', () => {
    it('should format empty search results correctly', () => {
      const output = formatSearchResults([]);
      expect(output).toContain('No servers found');
    });

    it('should format search results correctly', () => {
      const results: SearchResult[] = [
        {
          name: 'test-server',
          description: 'A test server',
          version: '1.0.0',
          type: Type.NPX,
          source: 'npm' as ServerSource,
          matchScore: 0.8
        },
        {
          name: 'dev-server',
          description: 'A development server',
          version: '2.0.0',
          type: Type.NPX,
          source: 'npm' as ServerSource,
          matchScore: 0.6
        }
      ];
      const output = formatSearchResults(results);
      
      expect(output).toContain('Available servers:');
      expect(output).toContain('NAME');
      expect(output).toContain('VERSION');
      expect(output).toContain('TYPE');
      expect(output).toContain('SOURCE');
      expect(output).toContain('DESCRIPTION');
      expect(output).toContain('test-server');
      expect(output).toContain('dev-server');
      expect(output).toContain('1.0.0');
      expect(output).toContain('2.0.0');
      expect(output).toContain('A test server');
      expect(output).toContain('A development server');
    });

    it('should handle missing optional fields', () => {
      const results: SearchResult[] = [
        {
          name: 'test-server',
          type: Type.NPX,
          source: 'npm' as ServerSource,
          matchScore: 0.8
        }
      ];
      const output = formatSearchResults(results);
      
      expect(output).toContain('Available servers:');
      expect(output).toContain('test-server');
      expect(output).toContain('N/A');
      expect(output).toContain('No description');
    });
  });
}); 