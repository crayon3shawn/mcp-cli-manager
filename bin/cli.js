#!/usr/bin/env node

/**
 * MCP CLI 管理器命令行入口
 */

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const pkg = require('../package.json');
const mcpManager = require('../index');

// 設置版本號和描述
program
  .name('mcp-cli-manager')
  .description('MCP 伺服器管理工具')
  .version(pkg.version);

// 列出伺服器命令
program
  .command('list')
  .description('列出已安裝的 MCP 伺服器')
  .option('-f, --format <type>', '輸出格式 (table/json/list)', 'table')
  .action(async (options) => {
    try {
      const output = await mcpManager.listServers(options);
      console.log(output);
    } catch (error) {
      console.error(chalk.red('列出伺服器時出錯:'), error.message);
      process.exit(1);
    }
  });

// 啟動伺服器命令
program
  .command('start <server>')
  .description('啟動指定的 MCP 伺服器')
  .option('-s, --silent', '靜默模式運行', false)
  .action(async (serverName, options) => {
    try {
      // 先檢查伺服器是否存在
      const servers = await mcpManager.detectServers();
      const server = servers.find(s => s.name === serverName);
      
      if (!server) {
        console.error(chalk.red(`找不到伺服器 '${serverName}'`));
        process.exit(1);
      }
      
      const result = await mcpManager.startServer(server, options);
      
      if (result.success) {
        console.log(chalk.green(`伺服器 '${serverName}' 已啟動`));
        console.log(`PID: ${result.process.pid}`);
      } else {
        console.error(chalk.red('啟動伺服器失敗:'), result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('啟動伺服器時出錯:'), error.message);
      process.exit(1);
    }
  });

// 停止伺服器命令
program
  .command('stop [server]')
  .description('停止指定的 MCP 伺服器，如果未指定則停止所有伺服器')
  .action(async (serverName) => {
    try {
      if (serverName) {
        const result = await mcpManager.stopServer(serverName);
        if (result.success) {
          console.log(chalk.green(result.message));
        } else {
          console.error(chalk.red('停止伺服器失敗:'), result.error);
          process.exit(1);
        }
      } else {
        const result = await mcpManager.stopAllServers();
        if (result.success) {
          for (const [name, status] of Object.entries(result.results)) {
            if (status.success) {
              console.log(chalk.green(`伺服器 '${name}' 已停止`));
            } else {
              console.error(chalk.yellow(`停止伺服器 '${name}' 失敗:`, status.error));
            }
          }
        }
      }
    } catch (error) {
      console.error(chalk.red('停止伺服器時出錯:'), error.message);
      process.exit(1);
    }
  });

// 安裝伺服器命令
program
  .command('install <server>')
  .description('安裝新的 MCP 伺服器')
  .option('-c, --client <name>', '客戶端名稱', 'cursor')
  .option('-s, --smithery', '使用 smithery 工具安裝', false)
  .action(async (serverName, options) => {
    try {
      const result = await mcpManager.installServer(serverName, options);
      
      if (result.success) {
        console.log(chalk.green(`伺服器 '${serverName}' 安裝成功`));
        if (result.configResult && result.configResult.success) {
          console.log(chalk.green(result.configResult.message));
        }
      } else {
        console.error(chalk.red('安裝伺服器失敗:'), result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('安裝伺服器時出錯:'), error.message);
      process.exit(1);
    }
  });

// 卸載伺服器命令
program
  .command('uninstall <server>')
  .description('卸載 MCP 伺服器')
  .option('-c, --client <name>', '客戶端名稱', 'cursor')
  .option('--keep-config', '保留配置文件', false)
  .action(async (serverName, options) => {
    try {
      // 先確認是否要卸載
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `確定要卸載伺服器 '${serverName}' 嗎？`,
          default: false
        }
      ]);
      
      if (!confirm) {
        console.log(chalk.yellow('已取消卸載'));
        return;
      }
      
      const result = await mcpManager.uninstallServer(serverName, {
        client: options.client,
        removeConfig: !options.keepConfig
      });
      
      if (result.success) {
        console.log(chalk.green(`伺服器 '${serverName}' 已卸載`));
        if (result.configResult && result.configResult.success) {
          console.log(chalk.green(result.configResult.message));
        }
      } else {
        console.error(chalk.red('卸載伺服器失敗:'), result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('卸載伺服器時出錯:'), error.message);
      process.exit(1);
    }
  });

// 狀態命令
program
  .command('status [server]')
  .description('顯示 MCP 伺服器的運行狀態')
  .action(async (serverName) => {
    try {
      if (serverName) {
        const status = await mcpManager.getServerStatus(serverName);
        if (status.running) {
          console.log(chalk.green(`伺服器 '${serverName}' 正在運行`));
          console.log(`PID: ${status.pid}`);
          console.log(`啟動時間: ${status.startTime}`);
          console.log(`運行時間: ${status.uptime} 秒`);
        } else {
          console.log(chalk.yellow(`伺服器 '${serverName}' 未運行`));
        }
      } else {
        const statuses = await mcpManager.getAllServerStatus();
        for (const [name, status] of Object.entries(statuses)) {
          if (status.running) {
            console.log(chalk.green(`伺服器 '${name}' 正在運行`));
            console.log(`PID: ${status.pid}`);
            console.log(`啟動時間: ${status.startTime}`);
            console.log(`運行時間: ${status.uptime} 秒`);
          } else {
            console.log(chalk.yellow(`伺服器 '${name}' 未運行`));
          }
          console.log('---');
        }
      }
    } catch (error) {
      console.error(chalk.red('獲取伺服器狀態時出錯:'), error.message);
      process.exit(1);
    }
  });

// 解析命令行參數
program.parse(); 