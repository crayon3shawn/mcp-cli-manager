/**
 * MCP Server Status Check Module
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'util';
import { ServerStatus, ServerStatusLiterals } from './types.js';

/**
 * Check if a process is running using system utilities
 */
const isProcessRunning = async (processName: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const process = spawn('pgrep', ['-f', processName]);
    let output = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.on('close', (code) => {
      resolve(code === 0 && output.trim().length > 0);
    });
  });
};

/**
 * Get server status
 */
export const getServerStatus = async (serverName: string): Promise<ServerStatus> => {
  try {
    const isRunning = await isProcessRunning(serverName);
    return isRunning ? ServerStatusLiterals.RUNNING : ServerStatusLiterals.STOPPED;
  } catch (error) {
    return ServerStatusLiterals.STOPPED;
  }
}; 