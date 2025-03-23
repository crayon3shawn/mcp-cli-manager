/**
 * MCP Server Management Module
 * Handles server installation, process management, and search
 */

import { type ChildProcess } from 'child_process';
import { createWriteStream, type WriteStream } from 'fs';
import { join } from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import spawn from 'cross-spawn';
import treeKill from 'tree-kill';
import winston from 'winston';
import { 
  Status, 
  Type,
  type ServerInfo, 
  type StatusInfo,
  type SearchResult,
  type SearchOptions,
  type InstallOptions,
  type InstallResult,
  ProcessError,
  SearchError
} from '../types.js';
import {
  getServerInfo,
  getInstalledServers,
  saveServerConfig,
  removeServerConfig
} from './config.js';

// 創建 logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// 簡化進程管理
const serverProcesses = new Map<string, ChildProcess>();

/**
 * Run a server
 */
export async function runServer(name: string): Promise<void> {
  try {
    const server = await getServerInfo(name);
    if (!server) {
      throw new ProcessError(`Server not found: ${name}`);
    }

    // 如果服務器已經在運行，先停止它
    if (serverProcesses.has(name)) {
      await stopServer(name);
    }

    // 創建日誌目錄
    const logDir = join(os.homedir(), '.cursor', 'logs');
    await fs.mkdir(logDir, { recursive: true });

    // 創建日誌文件
    const logFile = join(logDir, `${name}.log`);
    const logStream = createWriteStream(logFile, { flags: 'a' });

    // 啟動進程
    const process = spawn('npx', [server.command], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // 記錄進程信息
    process.stdout?.on('data', (data) => {
      logStream.write(data);
    });

    process.stderr?.on('data', (data) => {
      logStream.write(data);
    });

    // 保存進程引用
    serverProcesses.set(name, process);

    // 等待進程啟動
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new ProcessError(`Server ${name} failed to start: timeout`));
      }, 5000);

      process.on('error', (error) => {
        clearTimeout(timeout);
        reject(new ProcessError(`Failed to start server: ${error.message}`));
      });

      process.on('exit', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve();
        } else {
          reject(new ProcessError(`Server ${name} exited with code ${code}`));
        }
      });
    });

    logger.info(`Server ${name} started successfully`);
  } catch (error) {
    logger.error(`Failed to start server ${name}:`, error);
    throw new ProcessError(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Stop a server
 */
export async function stopServer(name: string): Promise<void> {
  try {
    const process = serverProcesses.get(name);
    if (!process) {
      return;
    }

    // 使用 tree-kill 確保所有子進程都被終止
    await new Promise<void>((resolve, reject) => {
      treeKill(process.pid!, 'SIGTERM', (error) => {
        if (error) {
          reject(new ProcessError(`Failed to stop server: ${error.message}`));
        } else {
          resolve();
        }
      });
    });

    serverProcesses.delete(name);
    logger.info(`Server ${name} stopped successfully`);
  } catch (error) {
    logger.error(`Failed to stop server ${name}:`, error);
    throw new ProcessError(`Failed to stop server: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Stop all servers
 */
export async function stopAllServers(): Promise<void> {
  const servers = Array.from(serverProcesses.keys());
  await Promise.all(servers.map(stopServer));
}

/**
 * Get server status
 */
export async function getServerStatus(name: string): Promise<StatusInfo> {
  const process = serverProcesses.get(name);
  if (!process) {
    return {
      name,
      type: Type.NPX,
      status: Status.STOPPED,
      source: 'local'
    };
  }

  return {
    name,
    type: Type.NPX,
    status: Status.RUNNING,
    pid: process.pid,
    source: 'local'
  };
}

/**
 * Install a server
 */
export async function installServer(name: string, options: InstallOptions = {}): Promise<InstallResult> {
  try {
    // Check if server is already installed
    const server = await getServerInfo(name);
    if (server && !options.force) {
      return {
        success: false,
        error: `Server ${name} is already installed`
      };
    }

    // Create server information with metadata
    const serverInfo: ServerInfo = {
      name,
      type: 'npx',
      command: name,
      source: 'global',
      metadata: {
        installedAt: new Date().toISOString(),
        version: options.version,
        lastUpdated: new Date().toISOString(),
        installOptions: options
      }
    };

    // Save server configuration
    await saveServerConfig(serverInfo);

    // Log installation
    logger.info(`Server ${name} installed successfully`, {
      version: options.version,
      force: options.force
    });

    return {
      success: true,
      server: serverInfo
    };
  } catch (error) {
    logger.error('Installation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Uninstall a server
 */
export async function uninstallServer(name: string): Promise<void> {
  try {
    const server = await getServerInfo(name);
    if (!server) {
      throw new ProcessError(`Server not found: ${name}`);
    }

    // Stop server if running
    if (serverProcesses.has(name)) {
      await stopServer(name);
    }

    // Remove server configuration
    await removeServerConfig(name);

    // Log uninstallation
    logger.info(`Server ${name} uninstalled successfully`);
  } catch (error) {
    logger.error('Uninstallation failed:', error);
    throw new ProcessError(`Failed to uninstall server: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Search for servers
 */
export async function searchServers(options: SearchOptions): Promise<SearchResult[]> {
  const { query, type, source, limit = 10 } = options;
  const results: SearchResult[] = [];

  try {
    // Search in npm registry
    if (!source || source === 'npm') {
      try {
        const npmResults = await searchNpm(query);
        results.push(...npmResults);
      } catch (error) {
        logger.warn('Failed to search npm registry:', error);
      }
    }

    // Search in GitHub
    if (!source || source === 'github') {
      try {
        const githubResults = await searchGithub(query);
        results.push(...githubResults);
      } catch (error) {
        logger.warn('Failed to search GitHub:', error);
      }
    }

    // Search in local registry
    if (!source || source === 'local') {
      try {
        const localResults = await searchLocal(query);
        results.push(...localResults);
      } catch (error) {
        logger.warn('Failed to search local registry:', error);
      }
    }

    // Filter by type if specified
    if (type) {
      results.filter(result => result.type === type);
    }

    // Sort by match score and limit results
    return results
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  } catch (error) {
    throw new SearchError(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Search npm registry
 */
async function searchNpm(query: string): Promise<SearchResult[]> {
  // TODO: Implement npm registry search using npm-registry-fetch
  return [];
}

/**
 * Search GitHub
 */
async function searchGithub(query: string): Promise<SearchResult[]> {
  // TODO: Implement GitHub search
  return [];
}

/**
 * Search local registry
 */
async function searchLocal(query: string): Promise<SearchResult[]> {
  // TODO: Implement local registry search
  return [];
}

/**
 * Calculate match score for a search result
 */
function calculateMatchScore(result: SearchResult, query: string): number {
  const queryLower = query.toLowerCase();
  const nameLower = result.name.toLowerCase();
  const descriptionLower = result.description?.toLowerCase() || '';

  let score = 0;

  // Exact name match
  if (nameLower === queryLower) {
    score += 100;
  }
  // Name contains query
  else if (nameLower.includes(queryLower)) {
    score += 50;
  }
  // Description contains query
  else if (descriptionLower.includes(queryLower)) {
    score += 30;
  }

  // Additional scoring factors
  if (result.version) {
    score += 10;
  }
  if (result.description) {
    score += 5;
  }

  return score;
}

// Process cleanup
const cleanup = async () => {
  logger.info('Cleaning up servers...');
  await stopAllServers();
  process.exit(0);
};

// Handle process events
process.on('exit', stopAllServers);
process.on('SIGINT', cleanup); 