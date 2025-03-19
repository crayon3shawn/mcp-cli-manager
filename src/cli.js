#!/usr/bin/env node

const { program } = require('commander');
const config = require('./config');

program
  .name('mcp-cli-manager')
  .description('CLI tool for managing Model Context Protocol (MCP) servers')
  .version('0.1.0');

// Initialize command
program
  .command('init')
  .description('Initialize MCP configuration')
  .action(() => {
    try {
      // Check existing configs
      const existingConfigs = config.checkExistingConfigs();
      
      if (existingConfigs.length === 0) {
        // Create new config file
        config.saveConfig({ servers: {} });
        console.log('✓ Created new configuration file');
        return;
      }
      
      console.log('✓ Detected existing configurations:');
      existingConfigs.forEach((conf, index) => {
        console.log(`  ${index + 1}. ${conf.type} config (${conf.path})`);
      });
      
      // TODO: Add user interaction to select config to import
      
    } catch (error) {
      console.error('✗ Initialization failed:', error.message);
      process.exit(1);
    }
  });

// Import command
program
  .command('import')
  .description('Import existing configuration')
  .option('--from <path>', 'Specify configuration file path')
  .action((options) => {
    try {
      if (!options.from) {
        console.error('✗ Please specify configuration file path');
        return;
      }
      
      const importedConfig = config.importConfig(options.from);
      config.saveConfig(importedConfig);
      console.log('✓ Configuration imported successfully');
      
    } catch (error) {
      console.error('✗ Import failed:', error.message);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Manage configuration')
  .command('list')
  .description('List all configured servers')
  .action(() => {
    try {
      const conf = config.readConfig(config.CONFIG_PATHS.default);
      
      console.log('\nConfigured servers:');
      Object.entries(conf.servers).forEach(([name, server]) => {
        console.log(`\n${name}:`);
        console.log(`  Command: ${server.command}`);
        console.log(`  Args: ${server.args.join(' ')}`);
        if (server.description) {
          console.log(`  Description: ${server.description}`);
        }
      });
      
    } catch (error) {
      console.error('✗ Failed to read configuration:', error.message);
      process.exit(1);
    }
  });

program.parse(); 