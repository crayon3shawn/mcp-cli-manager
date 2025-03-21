/**
 * MCP 配置模組
 * 
 * 此模組定義了所有 MCP 相關的路徑和配置
 */

const path = require('path');
const os = require('os');

/**
 * MCP 客戶端配置文件路徑
 */
const CLIENT_CONFIG_PATHS = {
  // Cursor
  'cursor': path.join(os.homedir(), '.cursor', 'mcp.json'),
  // Claude Desktop
  'claude': path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  // Cline VSCode
  'cline': path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
  // GoMCP
  'gomcp': path.join(os.homedir(), '.config', 'gomcp', 'config.yaml')
};

/**
 * 常見的 MCP 伺服器安裝位置
 */
const COMMON_BIN_DIRS = [
  '/opt/homebrew/bin',
  '/usr/local/bin',
  path.join(os.homedir(), '.npm', 'bin')
];

/**
 * NPX 緩存目錄
 */
const NPX_CACHE_DIR = path.join(os.homedir(), '.npm', '_npx');

/**
 * 根據作業系統返回適當的配置路徑
 * @returns {Object} 配置路徑對象
 */
function getConfigPaths() {
  const platform = os.platform();
  
  if (platform === 'darwin') {
    return CLIENT_CONFIG_PATHS;
  } else if (platform === 'win32') {
    // Windows 路徑
    return {
      'cursor': path.join(os.homedir(), 'AppData', 'Roaming', 'Cursor', 'mcp.json'),
      'claude': path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'),
      'cline': path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
      'gomcp': path.join(os.homedir(), '.config', 'gomcp', 'config.yaml')
    };
  } else {
    // Linux 路徑
    return {
      'cursor': path.join(os.homedir(), '.cursor', 'mcp.json'),
      'claude': path.join(os.homedir(), '.config', 'claude', 'claude_desktop_config.json'),
      'cline': path.join(os.homedir(), '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
      'gomcp': path.join(os.homedir(), '.config', 'gomcp', 'config.yaml')
    };
  }
}

/**
 * 根據作業系統返回適當的二進制檔案目錄
 * @returns {Array<string>} 二進制檔案目錄列表
 */
function getBinaryDirs() {
  const platform = os.platform();
  const commonDirs = [path.join(os.homedir(), '.npm', 'bin')];
  
  if (platform === 'darwin') {
    return [
      '/opt/homebrew/bin',
      '/usr/local/bin',
      ...commonDirs
    ];
  } else if (platform === 'win32') {
    return [
      'C:\\Program Files\\mcp',
      'C:\\Program Files (x86)\\mcp',
      ...commonDirs
    ];
  } else {
    return [
      '/usr/local/bin',
      '/usr/bin',
      ...commonDirs
    ];
  }
}

module.exports = {
  CLIENT_CONFIG_PATHS: getConfigPaths(),
  COMMON_BIN_DIRS: getBinaryDirs(),
  NPX_CACHE_DIR,
  getConfigPaths,
  getBinaryDirs
}; 