/**
 * MCP 伺服器管理模組
 * 
 * 此模組負責:
 * 1. 啟動和停止 MCP 伺服器
 * 2. 檢查伺服器運行狀態
 * 3. 管理伺服器進程
 */

const { spawn } = require('child_process');
const { exec } = require('child_process');
const util = require('util');
const ps = require('ps-node');
const kill = require('tree-kill');

const execAsync = util.promisify(exec);
const psLookupAsync = util.promisify(ps.lookup);

// 存儲正在運行的伺服器進程
const runningServers = new Map();

/**
 * 檢查伺服器是否已經在運行
 * @param {string} serverName - 伺服器名稱
 * @returns {boolean} - 是否運行中
 */
function isServerRunning(serverName) {
  return runningServers.has(serverName);
}

/**
 * 檢查伺服器進程是否仍然存活
 * @param {number} pid - 進程 ID
 * @returns {Promise<boolean>} - 進程是否存活
 */
async function isProcessAlive(pid) {
  try {
    const processes = await psLookupAsync({ pid: pid });
    return processes.length > 0;
  } catch (error) {
    console.error(`檢查進程 ${pid} 時出錯:`, error.message);
    return false;
  }
}

/**
 * 檢查伺服器是否正在運行
 * @param {Object} server - 伺服器信息
 * @returns {Promise<boolean>} - 是否正在運行
 */
async function isServerRunning(server) {
  try {
    const processes = await psLookupAsync({
      command: server.command,
      arguments: server.args
    });
    
    return processes.length > 0;
  } catch (error) {
    console.error(`檢查伺服器狀態時出錯: ${server.name}`, error.message);
    return false;
  }
}

/**
 * 獲取所有伺服器的狀態
 * @param {Array<Object>} servers - 伺服器列表
 * @returns {Promise<Array<Object>>} - 帶有狀態信息的伺服器列表
 */
async function getServersStatus(servers) {
  const statusPromises = servers.map(async server => {
    const running = await isServerRunning(server);
    return {
      ...server,
      status: running ? '運行中' : '已停止'
    };
  });
  
  return Promise.all(statusPromises);
}

/**
 * 啟動 MCP 伺服器
 * @param {Object} server - 伺服器信息
 * @param {Object} options - 啟動選項
 * @param {boolean} options.silent - 是否抑制輸出
 * @returns {Promise<Object>} - 包含進程信息的對象
 */
async function startServer(server, options = {}) {
  const { silent = false } = options;
  
  if (isServerRunning(server.name)) {
    // 檢查進程是否確實存活
    const process = runningServers.get(server.name);
    const alive = await isProcessAlive(process.pid);
    
    if (alive) {
      return { success: false, error: `伺服器 '${server.name}' 已經在運行中`, process };
    } else {
      // 進程已結束但未更新記錄，清除記錄
      runningServers.delete(server.name);
    }
  }
  
  try {
    // 準備環境變量
    const env = { ...process.env, ...server.env };
    
    // 啟動伺服器進程
    const process = spawn(server.command, server.args, {
      env,
      stdio: silent ? 'ignore' : ['inherit', 'inherit', 'inherit'],
      detached: !silent // 在非靜默模式下分離進程
    });
    
    // 儲存進程信息
    const processInfo = {
      pid: process.pid,
      server: server,
      startTime: new Date(),
      process
    };
    
    runningServers.set(server.name, processInfo);
    
    // 設置進程退出處理
    process.on('exit', (code) => {
      if (runningServers.has(server.name)) {
        console.log(`伺服器 '${server.name}' 已退出，退出碼: ${code}`);
        runningServers.delete(server.name);
      }
    });
    
    return { success: true, process: processInfo };
  } catch (error) {
    return { success: false, error: `啟動伺服器 '${server.name}' 失敗: ${error.message}` };
  }
}

/**
 * 停止 MCP 伺服器
 * @param {string} serverName - 伺服器名稱
 * @returns {Promise<Object>} - 操作結果
 */
async function stopServer(serverName) {
  if (!isServerRunning(serverName)) {
    return { success: false, error: `伺服器 '${serverName}' 未運行` };
  }
  
  const processInfo = runningServers.get(serverName);
  const { pid, process } = processInfo;
  
  try {
    // 使用 tree-kill 確保所有子進程也被終止
    return new Promise((resolve) => {
      kill(pid, 'SIGTERM', (err) => {
        if (err) {
          console.error(`停止伺服器 '${serverName}' 時出錯:`, err.message);
          resolve({ success: false, error: `停止伺服器失敗: ${err.message}` });
        } else {
          runningServers.delete(serverName);
          resolve({ success: true, message: `伺服器 '${serverName}' 已停止` });
        }
      });
    });
  } catch (error) {
    console.error(`停止伺服器 '${serverName}' 時出錯:`, error.message);
    return { success: false, error: `停止伺服器失敗: ${error.message}` };
  }
}

/**
 * 停止所有運行中的 MCP 伺服器
 * @returns {Promise<Object>} - 操作結果
 */
async function stopAllServers() {
  const results = {};
  
  for (const serverName of runningServers.keys()) {
    results[serverName] = await stopServer(serverName);
  }
  
  return { success: true, results };
}

/**
 * 獲取伺服器的運行狀態
 * @param {string} serverName - 伺服器名稱
 * @returns {Promise<Object>} - 伺服器狀態
 */
async function getServerStatus(serverName) {
  if (!isServerRunning(serverName)) {
    return { running: false };
  }
  
  const processInfo = runningServers.get(serverName);
  const alive = await isProcessAlive(processInfo.pid);
  
  if (!alive) {
    runningServers.delete(serverName);
    return { running: false };
  }
  
  return {
    running: true,
    pid: processInfo.pid,
    startTime: processInfo.startTime,
    uptime: Math.floor((new Date() - processInfo.startTime) / 1000)
  };
}

/**
 * 獲取所有伺服器的運行狀態
 * @returns {Promise<Object>} - 所有伺服器的狀態
 */
async function getAllServerStatus() {
  const statuses = {};
  
  for (const [serverName, processInfo] of runningServers.entries()) {
    statuses[serverName] = await getServerStatus(serverName);
  }
  
  return statuses;
}

module.exports = {
  startServer,
  stopServer,
  stopAllServers,
  isServerRunning,
  getServerStatus,
  getAllServerStatus,
  getServersStatus
}; 