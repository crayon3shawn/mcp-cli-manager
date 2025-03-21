/**
 * MCP CLI 管理器主入口文件
 * 
 * 此文件將所有模組導出為一個統一的 API
 */

const detector = require('./lib/detector');
const lister = require('./lib/lister');
const manager = require('./lib/manager');
const installer = require('./lib/installer');

// 將所有模組導出
module.exports = {
  // 偵測模組
  detectServers: detector.detectInstalledServers,
  
  // 列表模組
  listServers: lister.listServers,
  formatServersAsTable: lister.formatAsTable,
  formatServersAsJson: lister.formatAsJson,
  formatServersAsList: lister.formatAsList,
  
  // 管理模組
  startServer: manager.startServer,
  stopServer: manager.stopServer,
  stopAllServers: manager.stopAllServers,
  isServerRunning: manager.isServerRunning,
  getServerStatus: manager.getServerStatus,
  getAllServerStatus: manager.getAllServerStatus,
  
  // 安裝模組
  installServer: installer.installServer,
  uninstallServer: installer.uninstallServer,
  updateServerConfig: installer.updateClientConfig,
  removeServerConfig: installer.removeServerFromClientConfig,
  
  // 額外導出一些常量和工具函數
  constants: {
    CLIENT_CONFIG_PATHS: detector.CLIENT_CONFIG_PATHS,
    COMMON_BIN_DIRS: detector.COMMON_BIN_DIRS,
    KNOWN_SERVERS: installer.KNOWN_SERVERS
  },
  
  // 原始模組，以便進階使用
  _detector: detector,
  _lister: lister,
  _manager: manager,
  _installer: installer
}; 