import { Command, CommandContext } from './types.js';
import ora from 'ora';
import chalk from 'chalk';
import { searchServers } from '../services/search.js';
import { formatSearchResults } from '../utils/format.js';
import { ServerType, ServerSource } from '../types.js';

export const searchCommand: Command = {
  name: 'search',
  description: 'Search for servers',
  options: [
    {
      name: '--type <type>',
      description: 'Filter by server type',
      required: false
    },
    {
      name: '--source <source>',
      description: 'Filter by source',
      required: false
    },
    {
      name: '--limit <number>',
      description: 'Limit number of results',
      required: false,
      default: '10'
    }
  ],
  execute: async (args: string[]) => {
    const context: CommandContext = {
      verbose: args.includes('--verbose'),
      config: {} // TODO: Load config
    };

    const query = args[0];
    if (!query) {
      console.error(chalk.red('Error: Search query is required'));
      process.exit(1);
    }

    const spinner = ora('Searching servers...').start();
    
    try {
      const typeArg = args.find(arg => arg.startsWith('--type='))?.split('=')[1];
      const sourceArg = args.find(arg => arg.startsWith('--source='))?.split('=')[1];
      
      const results = await searchServers({
        query,
        type: typeArg as ServerType | undefined,
        source: sourceArg as ServerSource | undefined,
        limit: parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '10')
      });
      
      spinner.succeed('Search completed');
      
      const output = formatSearchResults(results);
      console.log(output);
    } catch (error) {
      spinner.fail('Search failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  }
}; 