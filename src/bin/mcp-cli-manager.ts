#!/usr/bin/env node

/**
 * MCP CLI Manager Entry
 */

import { Command } from 'commander';
import pkg from '../../package.json' with { type: 'json' };
import { installServer, uninstallServer, getServerInfo, getInstalledServers } from '../lib/install.js';
import { startServer, stopServer } from '../lib/process.js';
import { searchServers } from '../lib/search.js';
import { syncConfig } from '../lib/sync.js';
import { listServers } from '../lib/list.js';
import { ConnectionTypeLiterals } from '../lib/types.js';
import type { ServerType, TargetApp, Connection } from '../lib/types.js';
import { createInterface } from 'node:readline';
import { stdin, stdout, exit } from 'node:process';
import { getGlobalConfig, saveGlobalConfig } from '../lib/config.js';
import { getServerStatus } from '../lib/status.js';

const program = new Command();

program
  .name('mcp')
  .description('MCP Server Management Tool')
  .version(pkg.version);

// Install command
program
  .command('install')
  .description('Search and install a new MCP server')
  .argument('[keyword]', 'Search keyword')
  .option('-d, --directory <directory>', 'Allowed directory for filesystem server')
  .action(async (keyword: string = '', options: any) => {
    try {
      if (!keyword) {
        // 如果沒有提供關鍵字，顯示所有可用的服務器
        const results = await searchServers('');
        console.log('Available MCP Servers:');
        console.log(results);
        console.log('\nUsage: mcp install <keyword>');
        return;
      }

      // 如果是完整的包名，直接安裝
      if (keyword.startsWith('@modelcontextprotocol/server-')) {
        try {
          const args = options.directory ? [options.directory] : ['.'];
          const connection: Connection = {
            type: ConnectionTypeLiterals.STDIO,
            command: keyword,
            args
          };
          await installServer(keyword, 'npx', connection);
          console.log(`Server installed: ${keyword}`);
          return;
        } catch (error) {
          console.error('Installation failed:', error instanceof Error ? error.message : String(error));
          exit(1);
        }
      }

      // 搜尋服務器
      const results = await searchServers(keyword);
      if (results.length === 0) {
        console.log('No servers found matching your search.');
        return;
      }

      // 顯示搜尋結果
      console.log('\nFound the following servers:');
      console.log('----------------------------------------');
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.name}`);
        console.log(`   Version: ${result.version}`);
        console.log(`   Description: ${result.description}`);
        console.log('----------------------------------------');
      });

      // 詢問用戶是否要安裝
      const rl = createInterface({
        input: stdin,
        output: stdout
      });

      rl.question('\nEnter the number of the server to install (or press Enter to cancel): ', async (answer: string) => {
        if (!answer) {
          rl.close();
          return;
        }

        const index = parseInt(answer) - 1;
        if (isNaN(index) || index < 0 || index >= results.length) {
          console.error('Invalid selection');
          rl.close();
          return;
        }

        const selectedServer = results[index];
        console.log('\nSelected server:');
        console.log('----------------------------------------');
        console.log(`Name: ${selectedServer.name}`);
        console.log(`Version: ${selectedServer.version}`);
        console.log(`Description: ${selectedServer.description}`);
        console.log('----------------------------------------');

        rl.question('\nDo you want to install this server? (y/n): ', async (confirm: string) => {
          rl.close();
          
          if (confirm.toLowerCase() !== 'y') {
            return;
          }

          try {
            // 如果包名已經包含 @modelcontextprotocol/server- 前綴，就不需要再添加
            const packageName = selectedServer.name.startsWith('@modelcontextprotocol/server-') 
              ? selectedServer.name 
              : `@modelcontextprotocol/server-${selectedServer.name}`;

            const args = options.directory ? [options.directory] : ['.'];
            const connection: Connection = {
              type: ConnectionTypeLiterals.STDIO,
              command: packageName,
              args
            };
            await installServer(packageName, 'npx', connection);
            console.log(`Server installed: ${packageName}`);
          } catch (error) {
            console.error('Installation failed:', error instanceof Error ? error.message : String(error));
            exit(1);
          }
        });
      });
    } catch (error) {
      console.error('Installation failed:', error instanceof Error ? error.message : String(error));
      exit(1);
    }
  });

// Uninstall command
program
  .command('uninstall')
  .description('Uninstall an MCP server')
  .argument('<n>', 'Server name')
  .action(async (name: string) => {
    try {
      await uninstallServer(name);
      console.log(`Server uninstalled: ${name}`);
    } catch (error) {
      console.error('Uninstallation failed:', error instanceof Error ? error.message : String(error));
      exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List installed MCP servers with status')
  .action(async () => {
    try {
      const output = await listServers();
      console.log(output);
    } catch (error) {
      console.error('Failed to list servers:', error instanceof Error ? error.message : String(error));
      exit(1);
    }
  });

// Search command
program
  .command('search')
  .description('Search for MCP servers')
  .argument('[keyword]', 'Search keyword')
  .action(async (keyword: string = '') => {
    try {
      const results = await searchServers(keyword);
      console.log(results);
    } catch (error) {
      console.error('Search failed:', error instanceof Error ? error.message : String(error));
      exit(1);
    }
  });

// Start command
program
  .command('start')
  .description('Start an MCP server')
  .argument('<n>', 'Server name')
  .action(async (name: string) => {
    try {
      const server = await getServerInfo(name);
      if (!server) {
        throw new Error(`Server not found: ${name}`);
      }
      await startServer(name);
    } catch (error) {
      console.error('Failed to start server:', error instanceof Error ? error.message : String(error));
      exit(1);
    }
  });

// Stop command
program
  .command('stop')
  .description('Stop an MCP server')
  .argument('[name]', 'Server name')
  .action(async (name?: string) => {
    try {
      if (name) {
        await stopServer(name);
      } else {
        // Stop all running servers
        const servers = await getInstalledServers();
        for (const server of servers) {
          const status = await getServerStatus(server.name);
          if (status === 'running') {
            await stopServer(server.name);
          }
        }
      }
    } catch (error) {
      console.error('Failed to stop server:', error instanceof Error ? error.message : String(error));
      exit(1);
    }
  });

// Status command (alias for list)
program
  .command('status')
  .description('Show MCP server status (alias for "list")')
  .action(async () => {
    try {
      const output = await listServers();
      console.log(output);
    } catch (error) {
      console.error('Failed to get status:', error instanceof Error ? error.message : String(error));
      exit(1);
    }
  });

// Sync command
program
  .command('sync')
  .description('Synchronize MCP configuration')
  .argument('[target]', 'Target application (cursor or claude-desktop)', 'cursor')
  .action(async (target: string) => {
    try {
      await syncConfig(target as TargetApp);
    } catch (error) {
      console.error('Sync failed:', error instanceof Error ? error.message : String(error));
      exit(1);
    }
  });

program.parse(); 