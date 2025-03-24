#!/usr/bin/env node

import { Command } from 'commander';
import ora from 'ora';
import {
  installServer,
  uninstallServer,
  runServer,
  stopServer,
  getServerStatus,
  searchServers,
  listServers,
  type ServerConfig,
} from '@mcp-cli-manager/core';

const program = new Command();

program
  .name('mcp-cli-manager')
  .description('CLI tool for managing Minecraft server instances')
  .version('1.0.0');

program
  .command('install')
  .description('Install a new server')
  .argument('<n>', 'Server name')
  .action(async (name) => {
    const spinner = ora('Installing server...').start();
    try {
      const config: ServerConfig = {
        name,
        type: 'minecraft',
        host: 'localhost',
        port: 25565,
        username: 'admin',
        password: 'admin'
      };
      await installServer(config);
      spinner.succeed('Server installed successfully');
    } catch (error) {
      spinner.fail('Failed to install server');
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('uninstall')
  .description('Uninstall a server')
  .argument('<n>', 'Server name')
  .action(async (name) => {
    const spinner = ora('Uninstalling server...').start();
    try {
      const config: ServerConfig = {
        name,
        type: 'minecraft',
        host: 'localhost',
        port: 25565,
        username: 'admin',
        password: 'admin'
      };
      await uninstallServer(config);
      spinner.succeed('Server uninstalled successfully');
    } catch (error) {
      spinner.fail('Failed to uninstall server');
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('run')
  .description('Run a server')
  .argument('<n>', 'Server name')
  .action(async (name) => {
    const spinner = ora('Running server...').start();
    try {
      const config: ServerConfig = {
        name,
        type: 'minecraft',
        host: 'localhost',
        port: 25565,
        username: 'admin',
        password: 'admin'
      };
      await runServer(config);
      spinner.succeed('Server running successfully');
    } catch (error) {
      spinner.fail('Failed to run server');
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('stop')
  .description('Stop a server')
  .argument('<n>', 'Server name')
  .action(async (name) => {
    const spinner = ora('Stopping server...').start();
    try {
      const config: ServerConfig = {
        name,
        type: 'minecraft',
        host: 'localhost',
        port: 25565,
        username: 'admin',
        password: 'admin'
      };
      await stopServer(config);
      spinner.succeed('Server stopped successfully');
    } catch (error) {
      spinner.fail('Failed to stop server');
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check server status')
  .argument('<n>', 'Server name')
  .action(async (name) => {
    const spinner = ora('Checking server status...').start();
    try {
      const config: ServerConfig = {
        name,
        type: 'minecraft',
        host: 'localhost',
        port: 25565,
        username: 'admin',
        password: 'admin'
      };
      const status = await getServerStatus(config);
      spinner.succeed(`Server status: ${status}`);
    } catch (error) {
      spinner.fail('Failed to check server status');
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('search')
  .description('Search for servers')
  .argument('<query>', 'Search query')
  .action(async (query) => {
    const spinner = ora('Searching servers...').start();
    try {
      const servers = await searchServers(query);
      spinner.succeed('Search completed');
      console.log(servers);
    } catch (error) {
      spinner.fail('Failed to search servers');
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all installed servers')
  .action(async () => {
    const spinner = ora('Listing servers...').start();
    try {
      const servers = await listServers();
      spinner.succeed('Servers listed successfully');
      if (servers.length === 0) {
        console.log('No servers installed');
        return;
      }
      console.table(servers);
    } catch (error) {
      spinner.fail('Failed to list servers');
      console.error(error);
      process.exit(1);
    }
  });

program.parse(); 