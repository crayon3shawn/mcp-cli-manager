#!/usr/bin/env node

/**
 * MCP CLI Manager Entry
 */

import { Command } from 'commander';
import pkg from '../../package.json' with { type: 'json' };
import { registerServer, unregisterServer, getServerInfo, getRegisteredServers } from '../lib/regist.js';
import { runServer, stopServer, stopAllServers } from '../lib/process.js';
import { getStatus } from '../lib/status.js';
import { searchServers, formatSearchResults } from '../lib/search.js';
import { syncConfig } from '../lib/sync.js';
import { listServers } from '../lib/list.js';
import type { ServerType, TargetApp } from '../lib/types.js';

const program = new Command();

program
  .name('mcp')
  .description('MCP Server Management Tool')
  .version(pkg.version);

// Regist command
program
  .command('regist')
  .description('Search and register a new MCP server')
  .argument('[keyword]', 'Search keyword')
  .action(async (keyword: string = '', options: any) => {
    try {
      if (!keyword) {
        // 如果沒有提供關鍵字，顯示所有可用的服務器
        const results = await searchServers('');
        console.log('Available MCP Servers:');
        console.log(formatSearchResults(results));
        console.log('\nUsage: mcp regist <keyword>');
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

      // 詢問用戶是否要註冊
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('\nEnter the number of the server to register (or press Enter to cancel): ', async (answer) => {
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

        rl.question('\nDo you want to register this server? (y/n): ', async (confirm) => {
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
            console.log(`Server registered: ${name}`);
          } catch (error) {
            console.error('Registration failed:', error instanceof Error ? error.message : String(error));
            process.exit(1);
          }
        });
      });
    } catch (error) {
      console.error('Registration failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Unregister command
program
  .command('unregister')
  .description('Unregister an MCP server')
  .argument('<name>', 'Server name')
  .action(async (name: string) => {
    try {
      await unregisterServer(name);
      console.log(`Server unregistered: ${name}`);
    } catch (error) {
      console.error('Unregistration failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List registered MCP servers')
  .option('-f, --format <format>', 'Output format (table, json, list)', 'table')
  .action(async (options: any) => {
    try {
      const output = await listServers(options.format);
      console.log(output);
    } catch (error) {
      console.error('Failed to list servers:', error instanceof Error ? error.message : String(error));
      process.exit(1);
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
      process.exit(1);
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
      process.exit(1);
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
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show MCP server status')
  .action(async () => {
    try {
      const status = await getStatus();
      console.log(status);
    } catch (error) {
      console.error('Failed to get status:', error instanceof Error ? error.message : String(error));
      process.exit(1);
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
      process.exit(1);
    }
  });

program.parse(); 