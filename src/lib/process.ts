/**
 * MCP Server Process Management Module
 */

import { spawn, type ChildProcess, type SpawnOptionsWithoutStdio } from 'child_process';
import { join } from 'path';
import { createWriteStream, type WriteStream, existsSync, mkdirSync } from 'fs';
import { configPaths } from './config/paths.js';
import { ProcessError } from './errors.js';
import { ServerStatusLiterals, type ServerInfo, type McpServer, type ServerStatusInfo } from './types.js';
import { getRegisteredServers, getServerInfo } from './regist.js';

/**
 * Server process type with additional metadata
 */
interface ServerProcess extends ChildProcess {
  startTime: string;
  logStream?: WriteStream;
}

/**
 * Server process state
 */
interface ServerState {
  process: ServerProcess;
  logFile: string;
}

/**
 * Date format options for timestamps
 */
const DATE_FORMAT_OPTIONS = {
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
} as const;

/**
 * Process spawn options
 */
const SPAWN_OPTIONS = {
  detached: true,
  stdio: 'pipe',
  shell: true,
} as const;

// Server process management
const serverProcesses = new Map<string, ServerState>();

/**
 * Add timestamp to log entries
 */
const logWithTimestamp = (data: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${data}`;
};

/**
 * Setup process event handlers
 */
const setupProcessHandlers = (
  childProcess: ServerProcess,
  server: ServerInfo,
  logStream: WriteStream
): void => {
  const cleanup = () => {
    serverProcesses.delete(server.name);
    logStream.end();
  };

  let isStarted = false;

  childProcess.stdout?.on('data', (data) => {
    const message = data.toString();
    logStream.write(logWithTimestamp(message));
    if (!isStarted && message.includes('Available on:')) {
      isStarted = true;
      childProcess.startTime = new Date().toLocaleString('en-US', DATE_FORMAT_OPTIONS);
    }
  });

  childProcess.stderr?.on('data', (data) => {
    const message = data.toString();
    logStream.write(logWithTimestamp(`[ERROR] ${message}`));
    if (!isStarted && message.includes('Available on:')) {
      isStarted = true;
      childProcess.startTime = new Date().toLocaleString('en-US', DATE_FORMAT_OPTIONS);
    }
  });

  childProcess.on('error', (error) => {
    const errorMessage = `Server error (${server.name}): ${error.message}`;
    console.error(errorMessage);
    logStream.write(logWithTimestamp(`[FATAL] ${error.message}\n`));
    cleanup();
    throw new ProcessError(errorMessage, error);
  });

  childProcess.on('exit', (code) => {
    const exitMessage = `Server stopped (${server.name}) with code: ${code}`;
    console.log(exitMessage);
    logStream.write(logWithTimestamp(`[EXIT] Process exited with code ${code}\n`));
    cleanup();
  });
};

const checkStarted = (proc: ChildProcess, logStream: WriteStream): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server failed to start within timeout'));
    }, 10000);

    proc.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      logStream.write(`[${new Date().toISOString()}] ${output}`);
      
      // Check for successful start message
      if (output.includes('Available on:')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      const error = data.toString();
      logStream.write(`[${new Date().toISOString()}] [ERROR] ${error}`);
    });

    proc.on('error', (error: Error) => {
      logStream.write(`[${new Date().toISOString()}] [ERROR] ${error.message}\n`);
      clearTimeout(timeout);
      reject(error);
    });

    proc.on('exit', (code: number | null) => {
      logStream.write(`[${new Date().toISOString()}] [EXIT] Process exited with code ${code}\n`);
      if (code !== 0) {
        clearTimeout(timeout);
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
};

/**
 * Run a server
 */
export const runServer = async (serverName: string): Promise<ServerStatusInfo> => {
  const server = await getServerInfo(serverName);
  if (!server) {
    throw new Error(`Server ${serverName} not found`);
  }

  const logsDir = join(configPaths.getPath('global'), '..', 'logs');
  const logPath = join(logsDir, `${serverName}.log`);
  
  // Create logs directory if it doesn't exist
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }

  // Create write stream for logs
  const logStream = createWriteStream(logPath, { flags: 'a' });

  try {
    let command: string;
    let args: readonly string[];

    if (server.type === 'npx') {
      command = 'npx';
      args = [server.command, ...server.args];
    } else {
      command = server.command;
      args = server.args;
    }

    const proc = spawn(command, [...args], SPAWN_OPTIONS);
    
    // Wait for server to start
    await checkStarted(proc, logStream);
    
    // Store process info
    const serverInfo: ServerStatusInfo = {
      name: serverName,
      type: server.type,
      status: ServerStatusLiterals.RUNNING,
      startTime: new Date().toISOString(),
    };
    
    return serverInfo;
  } catch (error) {
    logStream.write(`[${new Date().toISOString()}] [FATAL] ${error}\n`);
    throw error;
  } finally {
    // Keep log stream open for process output
  }
};

/**
 * Stop a server
 */
export const stopServer = async (serverName: string): Promise<void> => {
  const server = await getServerInfo(serverName);
  if (!server) {
    return;
  }

  try {
    const processes = await import('node:process');
    processes.kill(processes.pid);
  } catch (error) {
    console.error(`Failed to stop server ${serverName}:`, error);
  }
};

/**
 * Stop all running servers
 */
export const stopAllServers = async (): Promise<void> => {
  const servers = await getRegisteredServers();
  await Promise.all(
    servers.map((server) => stopServer(server.name))
  );
};

/**
 * Get server process
 */
export function getServerProcess(name: string): ServerProcess | null {
  return serverProcesses.get(name)?.process ?? null;
}

/**
 * Get all running server names
 */
export const getRunningServers = (): string[] => 
  Array.from(serverProcesses.keys());

// Process cleanup
const cleanup = async () => {
  console.log('\nCleaning up servers...');
  await stopAllServers();
  process.exit(0);
};

// Handle process events
process.on('exit', stopAllServers);
process.on('SIGINT', cleanup); 