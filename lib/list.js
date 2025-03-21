/**
 * MCP Server List Display Module
 * 
 * This module is responsible for:
 * 1. Formatting and displaying server lists
 * 2. Providing different display formats (table, JSON, simple list)
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { getRegisteredServers, getGlobalServers, getCursorServers } from './regist.js';

/**
 * Simplify server name by removing common prefixes
 * @param {string} fullName - Full server name
 * @returns {string} - Simplified server name
 */
function simplifyServerName(fullName) {
  let simplified = fullName
    .replace(/^@?mcp[-\/]/, '')
    .replace(/^@?server[-\/]/, '')
    .replace(/^@modelcontextprotocol\/server-/, '');
  
  if (simplified.startsWith('@')) {
    simplified = simplified.split('/').pop();
  }
  
  return simplified;
}

/**
 * Format server list as table string
 * @param {Array<Object>} servers - Server list
 * @param {string} source - Source ('global' or 'cursor')
 * @returns {string} - Formatted table string
 */
function formatAsTable(servers, source) {
  if (!servers || servers.length === 0) {
    return `No ${source === 'cursor' ? 'Cursor' : 'Global'} MCP servers installed\n`;
  }

  const nameWidth = 25;
  const cmdWidth = 13;
  const argsWidth = 60;
  
  const header = 'name' + ' '.repeat(nameWidth - 4) + 
                '| cmd' + ' '.repeat(cmdWidth - 3) + 
                '| args';
  const separator = '-'.repeat(nameWidth + cmdWidth + argsWidth + 2); // +2 for the separators

  const rows = servers.map(server => {
    const name = server.name + ' '.repeat(Math.max(0, nameWidth - server.name.length));
    const cmd = (server.type === 'npx' ? chalk.blue(server.command) : chalk.yellow(server.command)) + 
               ' '.repeat(Math.max(0, cmdWidth - server.command.length - 2));
    const args = server.args.join(' ');
    
    return name + '| ' + cmd + ' | ' + args;
  }).join('\n');

  return header + '\n' + separator + '\n' + rows + '\n';
}

/**
 * Format search results as string
 * @param {Object} results - Search results
 * @returns {string} - Formatted search results
 */
function formatSearchResults(results) {
  const { installed, available } = results;

  if (installed.length === 0 && available.length === 0) {
    return 'No matching servers found';
  }

  let output = '';

  if (installed.length > 0) {
    output += 'Installed:\n';
    installed.forEach((server, index) => {
      output += `${index + 1}. ${server.name} (${server.type})\n`;
    });
    output += '\n';
  }

  if (available.length > 0) {
    output += 'Available:\n';
    available.forEach((server, index) => {
      output += `${index + 1}. ${server.name} (v${server.version})\n`;
      if (server.description) {
        output += `   ${server.description}\n`;
      }
    });
  }

  return output.trim();
}

/**
 * Format server list as JSON string
 * @param {Array<Object>} servers - Server list
 * @returns {string} - Formatted JSON string
 */
function formatAsJson(servers) {
  return JSON.stringify(servers, null, 2);
}

/**
 * Format server list as simple list
 * @param {Array<Object>} servers - Server list
 * @returns {string} - Formatted simple list string
 */
function formatAsList(servers) {
  if (servers.length === 0) {
    return 'No MCP servers installed';
  }
  
  return servers.map(server => {
    const type = server.type === 'npx' ? chalk.blue('npx') : chalk.yellow('bin');
    return `${server.name} (${type})`;
  }).join('\n');
}

/**
 * Get and display installed MCP server list
 * @param {Object} options - Options object
 * @param {string} options.format - Output format ('table', 'json', 'list')
 * @param {string} options.source - Source ('all', 'global', 'cursor')
 * @returns {Promise<string>} - Formatted server list
 */
async function listServers(options = {}) {
  const { format = 'table', source = 'all' } = options;
  
  try {
    let output = '';

    if (format === 'table') {
      if (source === 'all') {
        const [globalServers, cursorServers] = await Promise.all([
          getGlobalServers(),
          getCursorServers()
        ]);

        output = '\n'; // Add line break before global config
        output += 'Global MCP Configuration\n';
        output += formatAsTable(globalServers, 'global');
        output += '\n'; // Add line break between sections

        output += 'Cursor MCP Configuration\n';
        output += formatAsTable(cursorServers, 'cursor');

        return output;
      } else {
        const servers = source === 'global' 
          ? await getGlobalServers()
          : await getCursorServers();
        
        output = '\n'; // Add line break before config
        output += source === 'global' 
          ? 'Global MCP Configuration\n'
          : 'Cursor MCP Configuration\n';
        
        return output + formatAsTable(servers, source);
      }
    }

    const servers = source === 'all' 
      ? await getRegisteredServers()
      : source === 'global' 
        ? await getGlobalServers() 
        : await getCursorServers();

    switch (format.toLowerCase()) {
      case 'json':
        return formatAsJson(servers);
      case 'list':
        return formatAsList(servers);
      default:
        return formatAsTable(servers, source);
    }
  } catch (error) {
    throw new Error(`Failed to get server list: ${error.message}`);
  }
}

export {
  listServers,
  formatAsTable,
  formatAsJson,
  formatAsList,
  formatSearchResults
}; 