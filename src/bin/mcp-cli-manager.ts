#!/usr/bin/env node

/**
 * MCP CLI Manager
 * A simple command-line tool for managing MCP servers
 * Follows Unix philosophy: do one thing and do it well
 */

import { CommandRegistry } from '../commands/registry.js';
import inquirer from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import chalk from 'chalk';

// Register autocomplete prompt
inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

const registry = new CommandRegistry();

async function main() {
  const args = process.argv.slice(2);
  
  // If no command is provided, show interactive mode
  if (args.length === 0) {
    const { command } = await inquirer.prompt([
      {
        type: 'autocomplete',
        name: 'command',
        message: 'What would you like to do?',
        source: (answers: any, input: string) => {
          const commands = registry.getCommandNames();
          if (!input) return commands;
          return commands.filter(cmd => cmd.includes(input));
        }
      }
    ]);

    args.push(command);
  }

  const commandName = args[0];
  const command = registry.getCommand(commandName);

  if (!command) {
    console.error(chalk.red(`Error: Unknown command "${commandName}"`));
    console.log('\nAvailable commands:');
    registry.getAllCommands().forEach(cmd => {
      console.log(`  ${chalk.green(cmd.name)} - ${cmd.description}`);
    });
    process.exit(1);
  }

  try {
    await command.execute(args.slice(1));
  } catch (error) {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1); 
});