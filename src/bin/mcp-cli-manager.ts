#!/usr/bin/env node

/**
 * MCP CLI Manager Entry
 */

import { Command } from 'commander';
import pkg from '../../package.json' with { type: 'json' };
import { registerServer, unregisterServer, getServerInfo, getInstalledServers } from '../lib/install.js';
import { runServer, stopServer, stopAllServers } from '../lib/process.js';
import { searchServers, formatSearchResults } from '../lib/search.js';
import { syncConfig } from '../lib/sync.js';
import { listServers } from '../lib/list.js';
import type { ServerType, TargetApp } from '../lib/types.js';
import { createInterface } from 'node:readline';
import { stdin, stdout, exit } from 'node:process';
import { getGlobalConfig, saveGlobalConfig } from '../lib/config.js';
import { startServer } from '../lib/process.js';
import { getServerStatus } from '../lib/status.js';
import { installServer, uninstallServer } from '../lib/install.js';

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
  .action(async (keyword: string = '', options: any) => {
    try {
      if (!keyword) {
        // 如果沒有提供關鍵字，顯示所有可用的服務器
        const results = await searchServers('');
        console.log('Available MCP Servers:');
        console.log(formatSearchResults(results));
        console.log('\nUsage: mcp install <keyword>');
        return;
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

          const name = selectedServer.name;
          try {
            // 如果包名已經包含 @modelcontextprotocol/server- 前綴，就不需要再添加
            const packageName = name.startsWith('@modelcontextprotocol/server-') 
              ? name 
              : `@modelcontextprotocol/server-${name}`;

            await registerServer(name, 'npx', 'npx', {
              args: [packageName],
              env: {}
            });
            console.log(`Server installed: ${name}`);
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
      await unregisterServer(name);
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
      console.log(formatSearchResults(results));
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
      await runServer(name);
    } catch (error) {
      console.error('Failed to start server:', error instanceof Error ? error.message : String(error));
      exit(1);
    }
  });

// Stop command
program
  .command('stop')
  .description('Stop an MCP server')
  .argument('[name]', 'Server name (stop all if not specified)')
  .action(async (name?: string) => {
    try {
      if (name) {
        await stopServer(name);
      } else {
        await stopAllServers();
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