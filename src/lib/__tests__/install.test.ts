/**
 * MCP Server Installation Module Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { execa } from 'execa'
import { installServer, getServerInfo, getInstalledServers, uninstallServer } from '../install.ts'
import { ServerInfo, ServerTypeLiterals, ConnectionTypeLiterals, type StdioConnection, type WSConnection } from '../types.ts'
import type { ExecaReturnValue } from 'execa'

// Mock config module
vi.mock('../config.ts', () => {
  const getGlobalConfig = vi.fn()
  const saveGlobalConfig = vi.fn()
  return {
    getGlobalConfig,
    saveGlobalConfig,
    default: {
      getGlobalConfig,
      saveGlobalConfig
    }
  }
})

// Mock execa
vi.mock('execa', () => {
  const mockExeca = vi.fn()
  mockExeca.mockImplementation(async () => ({
    stdout: Buffer.from(''),
    stderr: Buffer.from(''),
    exitCode: 0,
    failed: false,
    killed: false,
    command: '',
    escapedCommand: '',
    timedOut: false,
    isCanceled: false,
    cwd: process.cwd(),
    all: Buffer.from(''),
    signal: undefined,
    signalDescription: undefined
  }))
  return { execa: mockExeca }
})

describe('Install Module', () => {
  const mockStdioConnection: StdioConnection = {
    type: ConnectionTypeLiterals.STDIO,
    command: 'test-server',
    args: ['--test'],
    env: { TEST: 'true' }
  }

  const mockServer: ServerInfo = {
    name: 'test-server',
    type: ServerTypeLiterals.NPX,
    connection: mockStdioConnection
  }

  let getGlobalConfig: ReturnType<typeof vi.fn>
  let saveGlobalConfig: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.resetAllMocks()
    const config = await import('../config.ts')
    getGlobalConfig = config.getGlobalConfig as ReturnType<typeof vi.fn>
    saveGlobalConfig = config.saveGlobalConfig as ReturnType<typeof vi.fn>
    getGlobalConfig.mockReturnValue({ servers: {} })
    vi.mocked(execa).mockReset()
  })

  describe('installServer', () => {
    it('should install a server successfully', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: Buffer.from(''),
        stderr: Buffer.from(''),
        exitCode: 0,
        failed: false,
        killed: false,
        command: 'test-server',
        escapedCommand: 'test-server',
        timedOut: false,
        isCanceled: false,
        cwd: process.cwd(),
        all: Buffer.from(''),
        signal: undefined,
        signalDescription: undefined
      })
      getGlobalConfig.mockReturnValue({ servers: {} })

      await installServer(mockServer.name, mockServer.type, mockServer.connection)

      expect(saveGlobalConfig).toHaveBeenCalledWith({
        servers: {
          'test-server': mockServer
        }
      })
    })

    it('should handle installation error', async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error('Installation failed'))

      const promise = installServer(mockServer.name, mockServer.type, mockServer.connection)
      await expect(promise).rejects.toThrow('安裝失敗')
    })

    it('should handle stderr output', async () => {
      vi.mocked(execa).mockRejectedValueOnce({
        stdout: Buffer.from(''),
        stderr: Buffer.from('Error: something went wrong'),
        exitCode: 1,
        failed: true,
        killed: false,
        command: 'test-server',
        escapedCommand: 'test-server',
        timedOut: false,
        isCanceled: false,
        cwd: process.cwd(),
        all: Buffer.from(''),
        signal: undefined,
        signalDescription: undefined
      })

      const promise = installServer(mockServer.name, mockServer.type, mockServer.connection)
      await expect(promise).rejects.toThrow('安裝失敗')
    })

    it('should validate server type', async () => {
      const invalidServer = {
        ...mockServer,
        type: 'invalid-type' as typeof ServerTypeLiterals[keyof typeof ServerTypeLiterals]
      }

      const promise = installServer(invalidServer.name, invalidServer.type, invalidServer.connection)
      await expect(promise).rejects.toThrow('安裝失敗')
    })

    it('should validate command', async () => {
      const invalidServer = {
        ...mockServer,
        connection: {
          ...mockServer.connection,
          command: ''
        }
      }

      const promise = installServer(invalidServer.name, invalidServer.type, invalidServer.connection)
      await expect(promise).rejects.toThrow('安裝失敗')
    })

    it('should install a Windsurf server with configuration', async () => {
      const wsConnection: WSConnection = {
        type: ConnectionTypeLiterals.WS,
        url: 'ws://localhost:8080',
        config: {
          port: 8080,
          host: 'localhost',
          options: {}
        }
      }

      const windsurfServer: ServerInfo = {
        name: 'windsurf-server',
        type: ServerTypeLiterals.WINDSURF,
        connection: wsConnection
      }

      vi.mocked(execa).mockResolvedValueOnce({
        stdout: Buffer.from(''),
        stderr: Buffer.from(''),
        exitCode: 0,
        failed: false,
        killed: false,
        command: 'windsurf-server',
        escapedCommand: 'windsurf-server',
        timedOut: false,
        isCanceled: false,
        cwd: process.cwd(),
        all: Buffer.from(''),
        signal: undefined,
        signalDescription: undefined
      })
      getGlobalConfig.mockReturnValue({ servers: {} })

      await installServer(windsurfServer.name, windsurfServer.type, windsurfServer.connection)

      expect(saveGlobalConfig).toHaveBeenCalledWith({
        servers: {
          'windsurf-server': windsurfServer
        }
      })
    })

    it('should install a Cline Client server with configuration', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: Buffer.from(''),
        stderr: Buffer.from(''),
        exitCode: 0,
        failed: false,
        killed: false,
        command: 'npm install -g test-server',
        escapedCommand: 'npm install -g test-server',
        timedOut: false,
        isCanceled: false,
        cwd: process.cwd(),
        all: Buffer.from(''),
        signal: undefined,
        signalDescription: undefined
      })

      const config = {
        port: 8080,
        host: 'localhost',
        options: { debug: true }
      }

      const connection: StdioConnection = {
        type: ConnectionTypeLiterals.STDIO,
        command: 'test-server',
        args: [],
        env: {},
        config
      }

      const result = await installServer('test-server', ServerTypeLiterals.CLINE, connection)

      expect(result).toEqual({
        name: 'test-server',
        type: ServerTypeLiterals.CLINE,
        connection
      })
    })

    it('should validate Windsurf configuration', async () => {
      const invalidConfig = {
        port: 'invalid', // Should be a number
        host: 123, // Should be a string
        options: 'invalid' // Should be an object
      }

      const connection: WSConnection = {
        type: ConnectionTypeLiterals.WS,
        url: 'ws://localhost:8080',
        config: invalidConfig
      }

      const promise = installServer('windsurf-server', ServerTypeLiterals.WINDSURF, connection)
      await expect(promise).rejects.toThrow('安裝失敗')
    })

    it('should validate Cline Client configuration', async () => {
      const invalidConfig = {
        port: 'invalid', // Should be a number
        host: 123, // Should be a string
        options: 'invalid' // Should be an object
      }

      const connection: StdioConnection = {
        type: ConnectionTypeLiterals.STDIO,
        command: 'test-server',
        args: [],
        env: {},
        config: invalidConfig
      }

      const promise = installServer('test-server', ServerTypeLiterals.CLINE, connection)
      await expect(promise).rejects.toThrow('安裝失敗')
    })
  })

  describe('getServerInfo', () => {
    it('should return server info', async () => {
      getGlobalConfig.mockReturnValue({
        servers: {
          'test-server': mockServer
        }
      })

      const result = await getServerInfo('test-server')
      expect(result).toEqual(mockServer)
    })

    it('should return null for non-existent server', async () => {
      getGlobalConfig.mockReturnValue({ servers: {} })

      const result = await getServerInfo('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('getInstalledServers', () => {
    it('should return list of installed servers', async () => {
      getGlobalConfig.mockReturnValue({
        servers: {
          'test-server': mockServer
        }
      })

      const result = await getInstalledServers()
      expect(result).toEqual([mockServer])
    })
  })

  describe('uninstallServer', () => {
    it('should uninstall an existing server', async () => {
      getGlobalConfig.mockReturnValue({
        servers: {
          'test-server': mockServer
        }
      })

      await uninstallServer('test-server')

      expect(saveGlobalConfig).toHaveBeenCalledWith({
        servers: {}
      })
    })

    it('should throw error for non-existent server', async () => {
      getGlobalConfig.mockReturnValue({ servers: {} })

      const promise = uninstallServer('non-existent')
      await expect(promise).rejects.toThrow('伺服器 non-existent 不存在')
    })

    it('should handle uninstallation error', async () => {
      getGlobalConfig.mockReturnValue({
        servers: {
          'test-server': mockServer
        }
      })

      vi.mocked(execa).mockRejectedValueOnce(new Error('Uninstallation failed'))

      const promise = uninstallServer('test-server')
      await expect(promise).rejects.toThrow('移除失敗')
    })
  })
}) 