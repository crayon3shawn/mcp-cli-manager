import { Command } from './types.js';
import { listCommand } from './list.js';

export class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  constructor() {
    this.register(listCommand);
  }

  register(command: Command): void {
    this.commands.set(command.name, command);
  }

  getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  getCommandNames(): string[] {
    return Array.from(this.commands.keys());
  }
} 