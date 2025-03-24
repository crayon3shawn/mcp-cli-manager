import { vi } from 'vitest';
import { type ExecaReturnValue } from 'execa';
import { type ServerInfo } from '../types.js';
import { ServerTypeLiterals, ConnectionTypeLiterals } from '../types.js';

export const createMockExeca = (result: ExecaReturnValue) => {
  return vi.fn().mockResolvedValue(result);
};

export const createMockServerInfo = (overrides: Partial<ServerInfo> = {}): ServerInfo => ({
  name: 'test-server',
  type: ServerTypeLiterals.NPX,
  connection: {
    type: ConnectionTypeLiterals.STDIO,
    command: 'test-command'
  },
  ...overrides
});

export const createMockGlobalConfig = (servers: Record<string, ServerInfo> = {}) => ({
  servers
});

export const mockExecaSuccess = {
  stdout: '',
  stderr: '',
  exitCode: 0,
  failed: false,
  killed: false,
  command: '',
  escapedCommand: '',
  timedOut: false,
  isCanceled: false,
  cwd: process.cwd()
} as ExecaReturnValue;

export const mockExecaError = new Error('Command failed'); 