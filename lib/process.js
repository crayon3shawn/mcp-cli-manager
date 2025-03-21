/**
 * MCP Server Process Management Module
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { MCP_CONFIG_DIR } from './config.js';

// Server process management
const serverProcesses = new Map();

/**
 * Add timestamp to log entries
 * @param {string} data - Log data
 * @returns {string} Data with timestamp
 */
function logWithTimestamp(data) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${data}`;
}

/**
 * Run a server
 * @param {Object} server - Server configuration
 * @returns {Promise<void>}
 */
export async function runServer(server) {
  if (serverProcesses.has(server.name)) {
    console.log(`Server already running: ${server.name}`);
    return;
  }

  // Create logs directory if it doesn't exist
  const logsDir = join(MCP_CONFIG_DIR, 'logs');
  await mkdir(logsDir, { recursive: true });

  // Create log file
  const logFile = join(logsDir, `${server.name}.log`);
  const logStream = createWriteStream(logFile, { flags: 'a' });

  // Spawn process
  const process = spawn(server.command, server.args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
    shell: true
  });

  // Store start time
  process.startTime = new Date().toLocaleString('en-US', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Pipe output to log file with timestamps
  process.stdout.on('data', (data) => {
    logStream.write(logWithTimestamp(data.toString()));
  });
  process.stderr.on('data', (data) => {
    logStream.write(logWithTimestamp(`[ERROR] ${data.toString()}`));
  });

  // Unref the process
  process.unref();

  // Store process
  serverProcesses.set(server.name, process);
  console.log(`Started server: ${server.name}`);
  console.log(`Logs available at: ${logFile}`);

  // Handle process events
  process.on('error', (error) => {
    console.error(`Server error (${server.name}):`, error.message);
    logStream.write(logWithTimestamp(`[FATAL] ${error.message}\n`));
    serverProcesses.delete(server.name);
    logStream.end();
  });

  process.on('exit', (code) => {
    console.log(`Server stopped (${server.name}) with code: ${code}`);
    logStream.write(logWithTimestamp(`[EXIT] Process exited with code ${code}\n`));
    serverProcesses.delete(server.name);
    logStream.end();
  });
}

/**
 * Stop a server
 * @param {string} name - Server name
 * @returns {Promise<void>}
 */
export async function stopServer(name) {
  const process = serverProcesses.get(name);
  if (process) {
    process.kill();
    serverProcesses.delete(name);
    console.log(`Stopped server: ${name}`);
  }
}

/**
 * Stop all running servers
 * @returns {Promise<void>}
 */
export async function stopAllServers() {
  for (const [name, process] of serverProcesses.entries()) {
    try {
      process.kill();
      console.log(`Stopped server: ${name}`);
    } catch (error) {
      console.error(`Error stopping ${name}:`, error.message);
    }
    serverProcesses.delete(name);
  }
}

/**
 * Get server process
 * @param {string} name - Server name
 * @returns {ChildProcess|null} Server process or null if not running
 */
export function getServerProcess(name) {
  return serverProcesses.get(name) || null;
}

/**
 * Get all running server names
 * @returns {string[]} List of running server names
 */
export function getRunningServers() {
  return Array.from(serverProcesses.keys());
}

// Process cleanup on exit
process.on('exit', stopAllServers);

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Cleaning up...');
  stopAllServers().then(() => process.exit(0));
}); 