#!/usr/bin/env node

import { Command } from 'commander';
import { installServer, uninstallServer } from '@mcp-cli-manager/core';
import { startServer, stopServer, getServerStatus } from '@mcp-cli-manager/core';
import { searchServers } from '@mcp-cli-manager/core';
import { ora } from 'ora';

const program = new Command();

program
  .name('mcp-cli-manager')
  .description('CLI tool for managing MCP servers')
  .version('1.1.7');

program
  .command('install')
  .description('Install a new server')
  .argument('<name>', 'Server name')
  .action(async (name) => {
    const spinner = ora('Installing server...').start();
    try {
      await installServer(name);
      spinner.succeed('Server installed successfully');
    } catch (error) {
      spinner.fail('Failed to install server');
      process.exit(1);
    }
  });

program
  .command('uninstall')
  .description('Uninstall a server')
  .argument('<name>', 'Server name')
  .action(async (name) => {
    const spinner = ora('Uninstalling server...').start();
    try {
      await uninstallServer(name);
      spinner.succeed('Server uninstalled successfully');
    } catch (error) {
      spinner.fail('Failed to uninstall server');
      process.exit(1);
    }
  });

program
  .command('start')
  .description('Start a server')
  .argument('<name>', 'Server name')
  .action(async (name) => {
    const spinner = ora('Starting server...').start();
    try {
      await startServer(name);
      spinner.succeed('Server started successfully');
    } catch (error) {
      spinner.fail('Failed to start server');
      process.exit(1);
    }
  });

program
  .command('stop')
  .description('Stop a server')
  .argument('<name>', 'Server name')
  .action(async (name) => {
    const spinner = ora('Stopping server...').start();
    try {
      await stopServer(name);
      spinner.succeed('Server stopped successfully');
    } catch (error) {
      spinner.fail('Failed to stop server');
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check server status')
  .argument('<name>', 'Server name')
  .action(async (name) => {
    const spinner = ora('Checking server status...').start();
    try {
      const status = await getServerStatus(name);
      spinner.succeed(`Server status: ${status}`);
    } catch (error) {
      spinner.fail('Failed to check server status');
      process.exit(1);
    }
  });

program
  .command('search')
  .description('Search for available servers')
  .argument('<query>', 'Search query')
  .action(async (query) => {
    const spinner = ora('Searching for servers...').start();
    try {
      const results = await searchServers(query);
      spinner.succeed('Search completed');
      console.log(results);
    } catch (error) {
      spinner.fail('Failed to search for servers');
      process.exit(1);
    }
  });

program.parse(); 