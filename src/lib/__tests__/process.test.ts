import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { execa } from 'execa'
import { getGlobalConfig } from '../config.js'
import { startServer, stopServer, getServerStatus, getRunningServers, runningProcesses } from '../process.js'
import { ServerInfo, ServerTypeLiterals, ConnectionTypeLiterals, StdioConnection, WSConnection, WindsurfConfig } from '../types.ts'
import { ValidationError } from '../errors.js'

vi.mock('execa')
vi.mock('../config.js')

describe('Process Management', () => {
  const mockStdioConnection: StdioConnection = {
    type: ConnectionTypeLiterals.STDIO,
    command: 'test-command',
    args: ['--test'],
    env: { TEST: 'true' }
  }

  const mockServer: ServerInfo = {
    name: 'test-server',
    type: ServerTypeLiterals.NPX,
    connection: mockStdioConnection
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getGlobalConfig).mockResolvedValue({
      servers: {
        'test-server': mockServer
      }
    })
    runningProcesses.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
    runningProcesses.clear()
  })

  describe('startServer', () => {
    it('should start a stdio server', async () => {
      const mockProcess = {
        stdout: { 
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback('Server started')
            }
          })
        },
        stderr: { 
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback('')
            }
          })
        },
        on: vi.fn((event, callback) => {
          if (event === 'exit') {
            callback(0)
          }
        }),
        kill: vi.fn()
      }

      const mockExeca = vi.mocked(execa)
      mockExeca.mockReturnValueOnce(mockProcess as any)

      await startServer('test-server')

      expect(mockExeca).toHaveBeenCalledWith(
        mockStdioConnection.command,
        mockStdioConnection.args,
        {
          env: mockStdioConnection.env,
          stdio: ['pipe', 'pipe', 'pipe']
        }
      )
    })

    it('should start a WebSocket server', async () => {
      const wsConfig: WindsurfConfig = {
        port: 3000,
        host: 'localhost',
        options: {}
      }

      const wsConnection: WSConnection = {
        type: ConnectionTypeLiterals.WS,
        url: 'ws://localhost:3000',
        config: wsConfig
      }

      const wsServer: ServerInfo = {
        name: 'test-server',
        type: ServerTypeLiterals.WINDSURF,
        connection: wsConnection
      }

      vi.mocked(getGlobalConfig).mockResolvedValueOnce({
        servers: {
          'test-server': wsServer
        }
      })

      const mockProcess = {
        stdout: { 
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback('Server started')
            }
          })
        },
        stderr: { 
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback('')
            }
          })
        },
        on: vi.fn((event, callback) => {
          if (event === 'exit') {
            callback(0)
          }
        }),
        kill: vi.fn()
      }

      const mockExeca = vi.mocked(execa)
      mockExeca.mockReturnValueOnce(mockProcess as any)

      await startServer('test-server')

      expect(mockExeca).toHaveBeenCalledWith(
        'node',
        ['-e', expect.stringContaining('const WebSocket = require')],
        expect.objectContaining({
          stdio: ['pipe', 'pipe', 'pipe']
        })
      )
    })

    it('should throw error for non-existent server', async () => {
      vi.mocked(getGlobalConfig).mockResolvedValueOnce({
        servers: {}
      })

      await expect(startServer('non-existent')).rejects.toThrow('啟動失敗: 伺服器 non-existent 不存在')
    })

    it('should throw error if server is already running', async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn()
      }

      runningProcesses.set('test-server', {
        process: mockProcess as any,
        startTime: new Date().toISOString()
      })

      await expect(startServer('test-server')).rejects.toThrow('啟動失敗: 伺服器 test-server 已在運行中')
    })
  })

  describe('stopServer', () => {
    it('should stop a running server', async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn()
      }

      runningProcesses.set('test-server', {
        process: mockProcess as any,
        startTime: new Date().toISOString()
      })

      await stopServer('test-server')

      expect(mockProcess.kill).toHaveBeenCalled()
      expect(runningProcesses.has('test-server')).toBe(false)
    })

    it('should throw error if server is not running', async () => {
      await expect(stopServer('test-server')).rejects.toThrow('停止失敗: 伺服器 test-server 未運行')
    })
  })

  describe('getServerStatus', () => {
    it('should return running status for active server', async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn()
      }

      runningProcesses.set('test-server', {
        process: mockProcess as any,
        startTime: new Date().toISOString()
      })

      const status = await getServerStatus('test-server')
      expect(status).toBe('running')
    })

    it('should return stopped status for inactive server', async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn().mockImplementation(() => {
          throw new Error('Process not found')
        })
      }

      runningProcesses.set('test-server', {
        process: mockProcess as any,
        startTime: new Date().toISOString()
      })

      const status = await getServerStatus('test-server')
      expect(status).toBe('stopped')
    })

    it('should return stopped status for non-existent server', async () => {
      const status = await getServerStatus('non-existent')
      expect(status).toBe('stopped')
    })
  })

  describe('getRunningServers', () => {
    it('should return list of running servers', async () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(),
        kill: vi.fn()
      }

      const startTime = new Date().toISOString()
      runningProcesses.set('test-server', {
        process: mockProcess as any,
        startTime
      })

      const servers = await getRunningServers()
      expect(servers).toHaveLength(1)
      expect(servers[0].name).toBe('test-server')
      expect(servers[0].status).toBe('running')
      expect(servers[0].startTime).toBe(startTime)
    })

    it('should return empty list when no servers are running', async () => {
      const servers = await getRunningServers()
      expect(servers).toEqual([])
    })
  })
}) 