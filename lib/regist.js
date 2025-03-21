/**
 * MCP Server Registration Module
 */

import { promises as fs } from 'fs';
import { getGlobalConfig, writeJsonConfig, CONFIG_PATHS, readJsonConfig } from './config.js';

// Cache settings
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Cache state
const cache = {
  global: {
    data: null,
    expiry: null,
    lastModified: null
  },
  cursor: {
    data: null,
    expiry: null,
    lastModified: null
  }
};

/**
 * Check if file has been modified
 * @param {string} filePath - File path
 * @param {number} lastModified - Last modification time
 * @returns {Promise<boolean>} - Returns true if file has been modified
 */
async function isFileModified(filePath, lastModified) {
  try {
    const stats = await fs.stat(filePath);
    return !lastModified || stats.mtimeMs > lastModified;
  } catch (error) {
    return true; // If file doesn't exist or can't be read, consider it modified
  }
}

/**
 * Simplify server name
 * @param {string} fullName - Full server name
 * @returns {string} Simplified name
 */
function simplifyServerName(fullName) {
  // Remove common prefixes
  let simplified = fullName
    .replace(/^@?mcp[-\/]/, '')
    .replace(/^@?server[-\/]/, '')
    .replace(/^@modelcontextprotocol\/server-/, '');
  
  // If it's a scoped package, remove the scope part
  if (simplified.startsWith('@')) {
    simplified = simplified.split('/').pop();
  }
  
  return simplified;
}

/**
 * Register NPX type server
 * @param {string} name - Server name
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
export async function registNpxServer(name, options = {}) {
  try {
    const simplifiedName = simplifyServerName(name);
    const config = await getGlobalConfig();
    
    // Construct the full package name
    const fullPackageName = name.includes('@modelcontextprotocol/server-') 
      ? name 
      : `@modelcontextprotocol/server-${simplifiedName}`;
    
    config.mcpServers[simplifiedName] = {
      type: 'npx',
      command: 'npx',
      args: ['-y', fullPackageName],
      env: options.env || {}
    };
    
    await writeJsonConfig(CONFIG_PATHS.global, config);
    clearCache();
    
    console.log(`Server registered: ${simplifiedName}`);
    console.log('Note: If this server requires an API key, please set the corresponding environment variable when running');
  } catch (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }
}

/**
 * Register binary type server
 * @param {string} name - Server name
 * @param {string} binaryPath - Binary file path
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
export async function registBinaryServer(name, binaryPath, options = {}) {
  try {
    const simplifiedName = simplifyServerName(name);
    const config = await getGlobalConfig();
    
    config.mcpServers[simplifiedName] = {
      type: 'binary',
      command: binaryPath,
      args: options.args || [],
      env: options.env || {}
    };
    
    await writeJsonConfig(CONFIG_PATHS.global, config);
    clearCache();
    
    console.log(`Server registered: ${simplifiedName}`);
  } catch (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }
}

/**
 * Get globally registered servers
 * @returns {Promise<Array<Object>>} Server list
 */
export async function getGlobalServers() {
  try {
    const now = Date.now();
    const isExpired = !cache.global.expiry || now > cache.global.expiry;
    const isModified = await isFileModified(CONFIG_PATHS.global, cache.global.lastModified);

    // If cache is valid and file hasn't been modified, return cache
    if (!isExpired && !isModified && cache.global.data) {
      return cache.global.data;
    }

    const config = await getGlobalConfig();
    const servers = Object.entries(config.mcpServers || {}).map(([name, info]) => ({
      name: simplifyServerName(name),
      source: 'global',
      ...info
    }));

    // Update cache
    const stats = await fs.stat(CONFIG_PATHS.global);
    cache.global = {
      data: servers,
      expiry: now + CACHE_TTL,
      lastModified: stats.mtimeMs
    };

    return servers;
  } catch (error) {
    throw new Error(`Failed to get global server list: ${error.message}`);
  }
}

/**
 * Get Cursor servers
 * @returns {Promise<Array<Object>>} Server list
 */
export async function getCursorServers() {
  try {
    const now = Date.now();
    const isExpired = !cache.cursor.expiry || now > cache.cursor.expiry;
    const isModified = await isFileModified(CONFIG_PATHS.cursor, cache.cursor.lastModified);

    // If cache is valid and file hasn't been modified, return cache
    if (!isExpired && !isModified && cache.cursor.data) {
      return cache.cursor.data;
    }

    const config = await readJsonConfig(CONFIG_PATHS.cursor) || { mcpServers: {} };
    const servers = Object.entries(config.mcpServers || {}).map(([name, info]) => ({
      name: simplifyServerName(name),
      source: 'cursor',
      ...info
    }));

    // Update cache
    const stats = await fs.stat(CONFIG_PATHS.cursor);
    cache.cursor = {
      data: servers,
      expiry: now + CACHE_TTL,
      lastModified: stats.mtimeMs
    };

    return servers;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, return empty list
      return [];
    }
    throw new Error(`Failed to get cursor server list: ${error.message}`);
  }
}

/**
 * Get all registered servers
 * @returns {Promise<Array<Object>>} Server list
 */
export async function getRegisteredServers() {
  try {
    const [globalServers, cursorServers] = await Promise.all([
      getGlobalServers(),
      getCursorServers()
    ]);

    // Use Map to remove duplicate servers, use simplified name as key
    const serverMap = new Map();
    
    // First add global servers
    globalServers.forEach(server => {
      const simplifiedName = simplifyServerName(server.name);
      serverMap.set(simplifiedName, { 
        ...server, 
        name: simplifiedName,
        source: 'global' 
      });
    });
    
    // Then add cursor servers, if name is the same, update source
    cursorServers.forEach(server => {
      const simplifiedName = simplifyServerName(server.name);
      if (serverMap.has(simplifiedName)) {
        const existingServer = serverMap.get(simplifiedName);
        existingServer.source = 'both';
      } else {
        serverMap.set(simplifiedName, { 
          ...server, 
          name: simplifiedName,
          source: 'cursor' 
        });
      }
    });

    return Array.from(serverMap.values());
  } catch (error) {
    throw new Error(`Failed to get server list: ${error.message}`);
  }
}

/**
 * Get specific server information
 * @param {string} name - Server name
 * @returns {Promise<Object|null>} Server information, returns null if not registered
 */
export async function getServerInfo(name) {
  try {
    const servers = await getRegisteredServers();
    const simplifiedName = simplifyServerName(name);
    return servers.find(server => server.name === simplifiedName) || null;
  } catch (error) {
    throw new Error(`Failed to get server information: ${error.message}`);
  }
}

/**
 * Remove a server
 * @param {string} name - Server name
 * @returns {Promise<void>}
 */
export async function removeServer(name) {
  try {
    const config = await getGlobalConfig();
    const simplifiedName = simplifyServerName(name);
    
    if (!config.mcpServers[simplifiedName]) {
      throw new Error(`Server not found: ${simplifiedName}`);
    }
    
    delete config.mcpServers[simplifiedName];
    await writeJsonConfig(CONFIG_PATHS.global, config);
    clearCache();
    
    console.log(`Server removed: ${simplifiedName}`);
  } catch (error) {
    throw new Error(`Remove failed: ${error.message}`);
  }
}

/**
 * Register an MCP server
 * @param {string} name - Server name or package name
 * @returns {Promise<void>}
 */
export async function registerServer(name) {
  try {
    const config = await getGlobalConfig();
    const serverInfo = await getServerInfo(name);
    
    if (!serverInfo) {
      throw new Error(`Server not found: ${name}`);
    }

    // Check if server already exists
    const existingServer = config.mcpServers.find(s => s.name === serverInfo.name);
    if (existingServer) {
      throw new Error(`Server already registered: ${serverInfo.name}`);
    }

    config.mcpServers[serverInfo.name] = serverInfo;
    await writeJsonConfig(CONFIG_PATHS.global, config);
    console.log(`Server registered: ${serverInfo.name}`);
    console.log('Note: If this server requires an API key, please set the corresponding environment variable when running.');
  } catch (error) {
    throw new Error(`Failed to register server: ${error.message}`);
  }
}

/**
 * Clear cache
 * @param {string} [source] - Cache source to clear ('global' or 'cursor')
 */
function clearCache(source) {
  if (!source || source === 'global') {
    cache.global = {
      data: null,
      expiry: null,
      lastModified: null
    };
  }
  if (!source || source === 'cursor') {
    cache.cursor = {
      data: null,
      expiry: null,
      lastModified: null
    };
  }
}

export default {
  registNpxServer,
  registBinaryServer,
  getGlobalServers,
  getCursorServers,
  getRegisteredServers,
  getServerInfo,
  removeServer
}; 