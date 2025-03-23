import { Command, CommandContext } from './types.js';
import chalk from 'chalk';
import ora from 'ora';
import { formatListResults } from '../utils/format.js';
import { getInstalledServers } from '../services/config.js';
import { getServerStatus } from '../services/server.js';
import { type StatusInfo } from '../types.js';

export const listCommand: Command = {
  name: 'list',
  description: 'List all servers',
  options: [
    {
      name: '--verbose',
      description: 'Show detailed information',
      required: false,
      default: false
    }
  ],
  execute: async (args: string[]) => {
    const context: CommandContext = {
      verbose: args.includes('--verbose'),
      config: {} // TODO: Load config
    };

    const spinner = ora('Loading servers...').start();
    
    try {
      const installedServers = await getInstalledServers();
      
      if (installedServers.length === 0) {
        spinner.succeed('No servers found.');
        return;
      }

      const serverStatuses = await Promise.all(
        installedServers.map(server => getServerStatus(server.name))
      );
      
      spinner.succeed('Servers loaded');
      
      const output = formatListResults(serverStatuses, context.verbose);
      console.log(output);
    } catch (error) {
      spinner.fail('Failed to load servers');
      console.error('Error:', error);
      process.exit(1);
    }
  }
}; 