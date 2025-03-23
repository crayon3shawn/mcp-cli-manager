import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listCommand } from '../../commands/list.js';
import { mockConsole, mockProcess } from '../test-utils.js';
import ora from 'ora';
import * as serverService from '../../services/server.js';
import * as configService from '../../services/config.js';
import { Status, Type, type ServerSource } from '../../types.js';

// Mock ora
const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis()
};

vi.mock('ora', () => ({
  default: vi.fn(() => mockSpinner)
}));

// Mock services
vi.mock('../../services/server.js', () => ({
  getServerStatus: vi.fn()
}));

vi.mock('../../services/config.js', () => ({
  getInstalledServers: vi.fn()
}));

describe('list command', () => {
  let consoleMock: ReturnType<typeof mockConsole>;
  let processMock: ReturnType<typeof mockProcess>;

  beforeEach(() => {
    consoleMock = mockConsole();
    processMock = mockProcess();
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleMock.restore();
    processMock.restore();
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(configService.getInstalledServers).mockRejectedValue(new Error('Test error'));

    await listCommand.execute([]);

    expect(consoleMock.error).toHaveBeenCalledWith('Error:', expect.any(Error));
    expect(processMock.exit).toHaveBeenCalledWith(1);
  });

  it('should display message when no servers are found', async () => {
    vi.mocked(configService.getInstalledServers).mockResolvedValue([]);

    await listCommand.execute([]);

    expect(mockSpinner.succeed).toHaveBeenCalledWith('No servers found.');
  });

  it('should display servers when they exist', async () => {
    vi.mocked(configService.getInstalledServers).mockResolvedValue([
      {
        name: 'test-server',
        type: Type.NPX,
        command: 'test-server',
        source: 'npm' as ServerSource
      },
      {
        name: 'dev-server',
        type: Type.NPX,
        command: 'dev-server',
        source: 'npm' as ServerSource
      }
    ]);
    vi.mocked(serverService.getServerStatus).mockResolvedValueOnce({
      name: 'test-server',
      status: Status.RUNNING,
      pid: 1234,
      uptime: 3600,
      type: Type.NPX,
      source: 'npm' as ServerSource
    });
    vi.mocked(serverService.getServerStatus).mockResolvedValueOnce({
      name: 'dev-server',
      status: Status.STOPPED,
      pid: undefined,
      uptime: 0,
      type: Type.NPX,
      source: 'npm' as ServerSource
    });

    await listCommand.execute([]);

    expect(mockSpinner.succeed).toHaveBeenCalledWith('Servers loaded');
    expect(consoleMock.log).toHaveBeenCalledWith(expect.stringContaining('\nInstalled servers:'));
    expect(consoleMock.log).toHaveBeenCalledWith(expect.stringContaining('NAME  STATUS'));
    expect(consoleMock.log).toHaveBeenCalledWith(expect.stringContaining('test-server  running'));
    expect(consoleMock.log).toHaveBeenCalledWith(expect.stringContaining('dev-server  stopped'));
  });

  it('should show detailed info when verbose flag is used', async () => {
    vi.mocked(configService.getInstalledServers).mockResolvedValue([
      {
        name: 'test-server',
        type: Type.NPX,
        command: 'test-server',
        source: 'npm' as ServerSource
      }
    ]);
    vi.mocked(serverService.getServerStatus).mockResolvedValue({
      name: 'test-server',
      status: Status.RUNNING,
      pid: 1234,
      uptime: 3600,
      type: Type.NPX,
      source: 'npm' as ServerSource
    });

    await listCommand.execute(['--verbose']);

    expect(mockSpinner.succeed).toHaveBeenCalledWith('Servers loaded');
    expect(consoleMock.log).toHaveBeenCalledWith(expect.stringContaining('\nInstalled servers:'));
    expect(consoleMock.log).toHaveBeenCalledWith(expect.stringContaining('NAME  STATUS  TYPE  PID  UPTIME'));
    expect(consoleMock.log).toHaveBeenCalledWith(expect.stringContaining('test-server  running  npx  1234  1h'));
  });
}); 