/**
 * MCP Server Installation Module Tests
 */

import { jest, type Mock } from '@jest/globals';
import { installServer, getServerInfo, getInstalledServers, uninstallServer } from '../install.js';
import { ServerInfo, ServerType, ServerTypeLiterals } from '../types.js';
import type { ExecaResult } from 'execa';

// Mock config module
jest.mock('../config.js', () => ({
  default: {
    getGlobalConfig: jest.fn(),
    saveGlobalConfig: jest.fn()
  }
}));

// Mock execa
jest.mock('execa', () => ({
  execa: jest.fn()
}));

describe('Install Module', () => {
  const mockServer: ServerInfo = {
    name: 'test-server',
    type: ServerTypeLiterals.NPX,
    command: 'test-server',
    args: ['--test'],
    env: { TEST: 'true' }
  };

  let getGlobalConfig: Mock;
  let saveGlobalConfig: Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    const config = await import('../config.js');
    getGlobalConfig = config.default.getGlobalConfig as Mock;
    saveGlobalConfig = config.default.saveGlobalConfig as Mock;
    getGlobalConfig.mockReturnValue({ servers: {} });
  });

  describe('installServer', () => {
    it('should install a server successfully', async () => {
      const { execa } = await import('execa');
      (execa as Mock<Promise<ExecaResult>>).mockResolvedValueOnce({
        stdout: 'success',
        stderr: '',
        exitCode: 0,
        failed: false,
        killed: false,
        command: 'npm install -g test-server',
        escapedCommand: 'npm install -g test-server',
        timedOut: false,
        isCanceled: false
      });

      const result = await installServer('test-server', ServerTypeLiterals.NPX, ['--test'], { TEST: 'true' });
      expect(result).toEqual(mockServer);
      expect(execa).toHaveBeenCalledWith('npm', ['install', '-g', 'test-server']);
    });

    it('should validate server type', async () => {
      await expect(installServer('test-server', 'invalid-type' as ServerType, [], {}))
        .rejects
        .toThrow('無效的伺服器類型');
    });

    it('should validate command', async () => {
      await expect(installServer('', ServerTypeLiterals.NPX, [], {}))
        .rejects
        .toThrow('命令不能為空');
    });
  });

  describe('getServerInfo', () => {
    it('should return server info for existing server', () => {
      getGlobalConfig.mockReturnValue({
        servers: {
          'test-server': mockServer
        }
      });

      const result = getServerInfo('test-server');
      expect(result).toEqual(mockServer);
    });

    it('should return null for non-existent server', () => {
      const result = getServerInfo('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getInstalledServers', () => {
    it('should return all installed servers', () => {
      getGlobalConfig.mockReturnValue({
        servers: {
          'test-server-1': mockServer,
          'test-server-2': { ...mockServer, name: 'test-server-2', command: 'test-server-2' }
        }
      });

      const result = getInstalledServers();
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockServer);
    });
  });

  describe('uninstallServer', () => {
    it('should uninstall an existing server', async () => {
      getGlobalConfig.mockReturnValue({
        servers: {
          'test-server': mockServer
        }
      });

      const { execa } = await import('execa');
      (execa as Mock<Promise<ExecaResult>>).mockResolvedValueOnce({
        stdout: 'success',
        stderr: '',
        exitCode: 0,
        failed: false,
        killed: false,
        command: 'npm uninstall -g test-server',
        escapedCommand: 'npm uninstall -g test-server',
        timedOut: false,
        isCanceled: false
      });

      await uninstallServer('test-server');
      expect(execa).toHaveBeenCalledWith('npm', ['uninstall', '-g', 'test-server']);
      expect(saveGlobalConfig).toHaveBeenCalledWith(expect.objectContaining({
        servers: {}
      }));
    });

    it('should throw error for non-existent server', async () => {
      await expect(uninstallServer('non-existent'))
        .rejects
        .toThrow('伺服器不存在');
    });
  });
}); 