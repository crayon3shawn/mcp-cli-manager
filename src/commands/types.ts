export interface Command {
  name: string;
  description: string;
  execute: (args: string[]) => Promise<void>;
  options?: CommandOption[];
}

export interface CommandOption {
  name: string;
  description: string;
  required?: boolean;
  default?: any;
}

export interface CommandContext {
  verbose: boolean;
  config: any;
} 