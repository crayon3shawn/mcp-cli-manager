/**
 * MCP 伺服器列表顯示模組
 * 
 * 此模組負責:
 * 1. 格式化並顯示伺服器列表
 * 2. 提供不同的顯示格式（表格、JSON、簡易列表等）
 */

const chalk = require('chalk');
const Table = require('cli-table3');
const { detectInstalledServers } = require('./detector');

/**
 * 獲取伺服器類型的顏色顯示
 * @param {string} type - 伺服器類型
 * @returns {string} - 帶顏色的類型字符串
 */
function getColoredType(type) {
  const text = type.padEnd(6);
  switch (type) {
    case 'binary':
      return '\x1b[32m' + text + '\x1b[0m';  // 綠色
    case 'npx':
      return '\x1b[36m' + text + '\x1b[0m';  // 青色
    default:
      return '\x1b[33m' + text + '\x1b[0m';  // 黃色
  }
}

/**
 * 將伺服器列表格式化為表格字符串
 * @param {Array<Object>} servers - 伺服器列表
 * @returns {string} - 格式化後的表格字符串
 */
function formatAsTable(servers) {
  if (servers.length === 0) {
    return '沒有找到已安裝的 MCP 伺服器';
  }

  // 創建表格
  const table = new Table({
    head: ['名稱', '類型', '客戶端', '命令'],
    style: {
      head: ['bold'],
      border: []
    },
    chars: {
      'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
      'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
      'left': '', 'left-mid': '', 'mid': '─', 'mid-mid': '─',
      'right': '', 'right-mid': '', 'middle': ' │ '
    },
    wordWrap: true,
    colWidths: [20, 10, 12, 40]
  });

  // 添加數據
  for (const server of servers) {
    const cmd = server.command + (server.args.length > 0 ? ' ' + server.args.join(' ') : '');
    table.push([
      server.name,
      server.type,
      server.client,
      cmd.length > 40 ? cmd.slice(0, 37) + '...' : cmd
    ]);
  }

  const output = table.toString();
  // 只保留表頭、分隔線和數據行
  const lines = output.split('\n').filter(line => line.trim() !== '');
  const dataLines = lines.slice(2).filter(line => !line.includes('─'));  // 跳過重複的表頭行並移除分隔線

  return '\n' + lines[0] + '\n' + lines[1] + '\n' + dataLines.join('\n') + '\n';
}

/**
 * 將伺服器列表格式化為 JSON 字符串
 * @param {Array<Object>} servers - 伺服器列表
 * @returns {string} - 格式化後的 JSON 字符串
 */
function formatAsJson(servers) {
  return JSON.stringify(servers, null, 2);
}

/**
 * 將伺服器列表格式化為簡易列表
 * @param {Array<Object>} servers - 伺服器列表
 * @returns {string} - 格式化後的簡易列表字符串
 */
function formatAsList(servers) {
  if (servers.length === 0) {
    return '沒有找到已安裝的 MCP 伺服器';
  }
  
  return servers.map(s => s.name).join('\n');
}

/**
 * 獲取並顯示已安裝的 MCP 伺服器列表
 * @param {Object} options - 選項對象
 * @param {string} options.format - 輸出格式（'table', 'json', 'list'）
 * @returns {Promise<string>} - 格式化後的伺服器列表
 */
async function listServers(options = {}) {
  const { format = 'table' } = options;
  
  const servers = await detectInstalledServers();
  
  // 根據格式選擇不同的輸出方式
  switch (format.toLowerCase()) {
    case 'json':
      return formatAsJson(servers);
    case 'list':
      return formatAsList(servers);
    case 'table':
    default:
      return formatAsTable(servers);
  }
}

module.exports = {
  listServers,
  formatAsTable,
  formatAsJson,
  formatAsList
}; 