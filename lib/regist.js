/**
 * MCP 伺服器註冊模組
 */

import { promises as fs } from 'fs';
import { getGlobalConfig, writeJsonConfig, CONFIG_PATHS, readJsonConfig } from './config.js';

// 快取設定
const CACHE_TTL = 5 * 60 * 1000; // 5 分鐘快取時效

// 快取狀態
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
 * 檢查檔案是否已被修改
 * @param {string} filePath - 檔案路徑
 * @param {number} lastModified - 上次修改時間
 * @returns {Promise<boolean>} - 如果檔案已修改則返回 true
 */
async function isFileModified(filePath, lastModified) {
  try {
    const stats = await fs.stat(filePath);
    return !lastModified || stats.mtimeMs > lastModified;
  } catch (error) {
    return true; // 如果檔案不存在或無法讀取，視為已修改
  }
}

/**
 * 簡化伺服器名稱
 * @param {string} fullName - 完整的伺服器名稱
 * @returns {string} 簡化後的名稱
 */
function simplifyServerName(fullName) {
  // 移除常見前綴
  let simplified = fullName
    .replace(/^@?mcp[-\/]/, '')
    .replace(/^@?server[-\/]/, '')
    .replace(/^@modelcontextprotocol\/server-/, '');
  
  // 如果是 scoped package，移除 scope 部分
  if (simplified.startsWith('@')) {
    simplified = simplified.split('/').pop();
  }
  
  return simplified;
}

/**
 * 註冊 NPX 類型的伺服器
 * @param {string} name - 伺服器名稱
 * @param {Object} options - 選項
 * @returns {Promise<void>}
 */
export async function registNpxServer(name, options = {}) {
  try {
    const simplifiedName = simplifyServerName(name);
    const config = await getGlobalConfig();
    
    config.mcpServers[simplifiedName] = {
      type: 'npx',
      command: 'npx',
      args: ['-y', name],
      env: options.env || {}
    };
    
    await writeJsonConfig(CONFIG_PATHS.global, config);
    clearCache();
    
    console.log(`已註冊伺服器：${simplifiedName}`);
    console.log('提示：如果此伺服器需要 API key，請在執行時設定對應的環境變數');
  } catch (error) {
    throw new Error(`註冊失敗：${error.message}`);
  }
}

/**
 * 註冊二進制類型的伺服器
 * @param {string} name - 伺服器名稱
 * @param {string} binaryPath - 二進制文件路徑
 * @param {Object} options - 選項
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
    
    console.log(`已註冊伺服器：${simplifiedName}`);
  } catch (error) {
    throw new Error(`註冊失敗：${error.message}`);
  }
}

/**
 * 取得全局註冊的伺服器
 * @returns {Promise<Array<Object>>} 伺服器列表
 */
export async function getGlobalServers() {
  try {
    const now = Date.now();
    const isExpired = !cache.global.expiry || now > cache.global.expiry;
    const isModified = await isFileModified(CONFIG_PATHS.global, cache.global.lastModified);

    // 如果快取有效且檔案未修改，直接返回快取
    if (!isExpired && !isModified && cache.global.data) {
      return cache.global.data;
    }

    const config = await getGlobalConfig();
    const servers = Object.entries(config.mcpServers || {}).map(([name, info]) => ({
      name: simplifyServerName(name),
      source: 'global',
      ...info
    }));

    // 更新快取
    const stats = await fs.stat(CONFIG_PATHS.global);
    cache.global = {
      data: servers,
      expiry: now + CACHE_TTL,
      lastModified: stats.mtimeMs
    };

    return servers;
  } catch (error) {
    throw new Error(`獲取全局伺服器列表失敗：${error.message}`);
  }
}

/**
 * 取得 Cursor 的伺服器
 * @returns {Promise<Array<Object>>} 伺服器列表
 */
export async function getCursorServers() {
  try {
    const now = Date.now();
    const isExpired = !cache.cursor.expiry || now > cache.cursor.expiry;
    const isModified = await isFileModified(CONFIG_PATHS.cursor, cache.cursor.lastModified);

    // 如果快取有效且檔案未修改，直接返回快取
    if (!isExpired && !isModified && cache.cursor.data) {
      return cache.cursor.data;
    }

    const config = await readJsonConfig(CONFIG_PATHS.cursor) || { mcpServers: {} };
    const servers = Object.entries(config.mcpServers || {}).map(([name, info]) => ({
      name: simplifyServerName(name),
      source: 'cursor',
      ...info
    }));

    // 更新快取
    const stats = await fs.stat(CONFIG_PATHS.cursor);
    cache.cursor = {
      data: servers,
      expiry: now + CACHE_TTL,
      lastModified: stats.mtimeMs
    };

    return servers;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 如果檔案不存在，返回空列表
      return [];
    }
    throw new Error(`獲取 Cursor 伺服器列表失敗：${error.message}`);
  }
}

/**
 * 取得所有已註冊的伺服器
 * @returns {Promise<Array<Object>>} 伺服器列表
 */
export async function getRegisteredServers() {
  try {
    const [globalServers, cursorServers] = await Promise.all([
      getGlobalServers(),
      getCursorServers()
    ]);

    // 使用 Map 來去除重複的伺服器，使用簡化名稱作為 key
    const serverMap = new Map();
    
    // 先加入全局伺服器
    globalServers.forEach(server => {
      const simplifiedName = simplifyServerName(server.name);
      serverMap.set(simplifiedName, { 
        ...server, 
        name: simplifiedName,
        source: 'global' 
      });
    });
    
    // 再加入 Cursor 伺服器，如果名稱相同則更新 source
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
    throw new Error(`獲取伺服器列表失敗：${error.message}`);
  }
}

/**
 * 取得特定伺服器的資訊
 * @param {string} name - 伺服器名稱
 * @returns {Promise<Object|null>} 伺服器資訊，如果未註冊則返回 null
 */
export async function getServerInfo(name) {
  try {
    const servers = await getRegisteredServers();
    const simplifiedName = simplifyServerName(name);
    return servers.find(server => server.name === simplifiedName) || null;
  } catch (error) {
    throw new Error(`獲取伺服器資訊失敗：${error.message}`);
  }
}

/**
 * 取消註冊伺服器
 * @param {string} name - 伺服器名稱
 * @returns {Promise<void>}
 */
export async function unregistServer(name) {
  try {
    const simplifiedName = simplifyServerName(name);
    const config = await getGlobalConfig();
    
    // 檢查伺服器是否存在於全局配置
    if (!config.mcpServers?.[simplifiedName]) {
      throw new Error(`找不到伺服器：${simplifiedName}`);
    }
    
    // 移除全局配置中的伺服器
    delete config.mcpServers[simplifiedName];
    await writeJsonConfig(CONFIG_PATHS.global, config);

    // 檢查是否也存在於 Cursor 配置
    const cursorConfig = await readJsonConfig(CONFIG_PATHS.cursor);
    if (cursorConfig?.mcpServers?.[simplifiedName]) {
      console.log(`注意：此伺服器在 Cursor 中也有註冊，請使用 sync 命令來同步配置`);
    }

    clearCache();
  } catch (error) {
    throw new Error(`取消註冊失敗：${error.message}`);
  }
}

/**
 * 清除快取
 * @param {string} [source] - 要清除的快取來源（'global' 或 'cursor'）
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
  getRegisteredServers,
  getGlobalServers,
  getCursorServers,
  getServerInfo,
  unregistServer
}; 