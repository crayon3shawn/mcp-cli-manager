import { describe, it, expect, beforeEach, vi } from 'vitest';
import { execa } from 'execa';
import { ServerTypeLiterals, ConnectionTypeLiterals } from '../types.js';
import { getServerStatus, getAllServersStatus } from '../status.js';
import { getGlobalConfig } from '../config.js';
import {
  createMockExeca,
  createMockServerInfo,
  createMockGlobalConfig,
  mockExecaSuccess,
  mockExecaError
} from './test-utils.js';

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn()
}));

// Mock config
vi.mock('../config.js', () => ({
  getGlobalConfig: vi.fn()
}));

describe('status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getGlobalConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      createMockGlobalConfig()
    );
  });

  describe('getServerStatus', () => {
    it('should return running status for a running NPX server', async () => {
      (execa as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockExecaSuccess);

      const serverInfo = createMockServerInfo({
        type: ServerTypeLiterals.NPX,
        connection: {
          type: ConnectionTypeLiterals.STDIO,
          command: 'test-command'
        }
      });

      (getGlobalConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockGlobalConfig({
          'test-server': serverInfo
        })
      );

      const status = await getServerStatus('test-server');
      expect(status).toBe('running');
    });

    it('should return running status for a running binary server', async () => {
      (execa as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockExecaSuccess);

      const serverInfo = createMockServerInfo({
        type: ServerTypeLiterals.BINARY,
        connection: {
          type: ConnectionTypeLiterals.STDIO,
          command: 'test-command'
        }
      });

      (getGlobalConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockGlobalConfig({
          'test-server': serverInfo
        })
      );

      const status = await getServerStatus('test-server');
      expect(status).toBe('running');
    });

    it('should return running status for a running Windsurf server', async () => {
      (execa as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockExecaSuccess);

      const serverInfo = createMockServerInfo({
        type: ServerTypeLiterals.WINDSURF,
        connection: {
          type: ConnectionTypeLiterals.WS,
          url: 'ws://localhost:8080'
        }
      });

      (getGlobalConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockGlobalConfig({
          'test-server': serverInfo
        })
      );

      const status = await getServerStatus('test-server');
      expect(status).toBe('running');
    });

    it('should return running status for a running Cline server', async () => {
      (execa as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockExecaSuccess);

      const serverInfo = createMockServerInfo({
        type: ServerTypeLiterals.CLINE,
        connection: {
          type: ConnectionTypeLiterals.WS,
          url: 'ws://localhost:8080'
        }
      });

      (getGlobalConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockGlobalConfig({
          'test-server': serverInfo
        })
      );

      const status = await getServerStatus('test-server');
      expect(status).toBe('running');
    });

    it('should return stopped status for a stopped server', async () => {
      (execa as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(mockExecaError);

      const serverInfo = createMockServerInfo();

      (getGlobalConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockGlobalConfig({
          'test-server': serverInfo
        })
      );

      const status = await getServerStatus('test-server');
      expect(status).toBe('stopped');
    });

    it('should throw error if server does not exist', async () => {
      await expect(getServerStatus('non-existent')).rejects.toThrow('伺服器 non-existent 不存在');
    });
  });

  describe('getAllServersStatus', () => {
    it('should return status for all servers', async () => {
      (execa as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockExecaSuccess);

      const servers = {
        'server1': createMockServerInfo({
          name: 'server1',
          type: ServerTypeLiterals.NPX,
          connection: {
            type: ConnectionTypeLiterals.STDIO,
            command: 'test-command-1'
          }
        }),
        'server2': createMockServerInfo({
          name: 'server2',
          type: ServerTypeLiterals.WINDSURF,
          connection: {
            type: ConnectionTypeLiterals.WS,
            url: 'ws://localhost:8080'
          }
        })
      };

      (getGlobalConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockGlobalConfig(servers)
      );

      const statuses = await getAllServersStatus();
      expect(statuses).toHaveLength(2);
      expect(statuses).toEqual([
        { name: 'server1', status: 'running' },
        { name: 'server2', status: 'running' }
      ]);
    });

    it('should return empty array if no servers exist', async () => {
      const statuses = await getAllServersStatus();
      expect(statuses).toHaveLength(0);
    });
  });
}); 