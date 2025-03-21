/**
 * MCP Server Status Check Module
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import Table from 'cli-table3';
import chalk from 'chalk';
import { getRegisteredServers, getServerInfo } from './regist.js';
import { getServerProcess } from './process.js';

const execAsync = promisify(exec);

/**
 * Get colored status text
 * @param {string} status - Status string
 * @returns {string} Colored status text
 */
function getColoredStatus(status) {
  switch (status.toLowerCase()) {
    case 'running':
      return chalk.green('running');
    case 'stopped':
      return chalk.red('stopped');
    case 'error':
      return chalk.red('error');
    case 'starting':
      return chalk.yellow('starting');
    default:
      return chalk.gray(status);
  }
}

/**
 * Get colored type text
 * @param {string} type - Type string
 * @returns {string} Colored type text
 */
function getColoredType(type) {
  return type === 'npx' ? chalk.blue('npx') : chalk.yellow('bin');
}

/**
 * Check server status
 * @param {Object} server - Server information
 * @returns {Promise<Object>} Status information
 */
async function checkServerStatus(server) {
  try {
    // Get process from process manager
    const process = getServerProcess(server.name);
    
    if (!process) {
      return {
        name: server.name,
        type: server.type,
        status: 'stopped',
        port: '-',
        startTime: '-'
      };
    }

    // Check if process is still running
    try {
      process.kill(0); // Test if process exists
      return {
        name: server.name,
        type: server.type,
        status: 'running',
        port: server.port || '-',
        startTime: process.startTime || '-'
      };
    } catch (e) {
      return {
        name: server.name,
        type: server.type,
        status: 'stopped',
        port: '-',
        startTime: '-'
      };
    }
  } catch (error) {
    return {
      name: server.name,
      type: server.type,
      status: 'error',
      port: '-',
      startTime: '-'
    };
  }
}

/**
 * Get status of all servers
 * @returns {Promise<Array<Object>>} Status list
 */
async function getServersStatus() {
  try {
    const servers = await getRegisteredServers();
    const statuses = await Promise.all(servers.map(checkServerStatus));
    return statuses;
  } catch (error) {
    throw new Error(`Failed to get status: ${error.message}`);
  }
}

/**
 * Get status of a specific server
 * @param {string} name - Server name
 * @returns {Promise<Object>} Status information
 */
async function getServerStatus(name) {
  try {
    const server = await getServerInfo(name);
    if (!server) {
      throw new Error(`Server not found: ${name}`);
    }
    return await checkServerStatus(server);
  } catch (error) {
    throw new Error(`Failed to get status: ${error.message}`);
  }
}

/**
 * Format server status as table string
 * @param {Array<Object>} servers - Server list with status
 * @returns {string} - Formatted table string
 */
function formatStatusTable(servers) {
  if (!servers || servers.length === 0) {
    return 'No MCP servers installed\n';
  }

  const nameWidth = 25;
  const statusWidth = 11;
  const portWidth = 8;
  const timeWidth = 25;
  
  const header = 'name' + ' '.repeat(nameWidth - 4) + 
                '| status' + ' '.repeat(statusWidth - 6) + 
                '| port' + ' '.repeat(portWidth - 4) + 
                '| startTime';
  const separator = '-'.repeat(nameWidth + statusWidth + portWidth + timeWidth + 3); // +3 for the separators

  const rows = servers.map(server => {
    const name = server.name + ' '.repeat(Math.max(0, nameWidth - server.name.length));
    const status = getColoredStatus(server.status) + 
                  ' '.repeat(Math.max(0, statusWidth - server.status.length - 2));
    const port = (server.port || '-') + ' '.repeat(Math.max(0, portWidth - String(server.port || '-').length - 1));
    const time = server.startTime || '-';
    
    return name + '| ' + status + ' | ' + port + ' | ' + time;
  }).join('\n');

  return '\n' + header + '\n' + separator + '\n' + rows + '\n';
}

/**
 * Get and display MCP server status
 * @returns {Promise<string>} - Formatted status table
 */
async function getStatus() {
  try {
    const servers = await getRegisteredServers();
    return formatStatusTable(servers);
  } catch (error) {
    throw new Error(`Failed to get server status: ${error.message}`);
  }
}

export {
  getServersStatus,
  getServerStatus,
  formatStatusTable,
  getStatus
}; 