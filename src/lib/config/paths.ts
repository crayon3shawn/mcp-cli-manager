/**
 * Configuration Path Management
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import type { ConfigPaths } from '../types.js';
import { ValidationError } from '../errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Environment configuration
 */
export const ENV = {
  isDev: process.env.NODE_ENV === 'development',
  home: os.homedir()
} as const;

/**
 * Default configuration paths
 */
const DEFAULT_PATHS: ConfigPaths = {
  // Global configuration (same as cursor for now)
  global: ENV.isDev 
    ? path.join(__dirname, '..', '..', 'dev-config', 'mcp.json')
    : path.join(os.homedir(), '.cursor', 'mcp.json'),
  // Client configurations
  cursor: ENV.isDev 
    ? path.join(__dirname, '..', '..', 'dev-config', 'cursor.json')
    : path.join(os.homedir(), '.cursor', 'mcp.json'),
  claude: ENV.isDev
    ? path.join(__dirname, '..', '..', 'dev-config', 'claude.json')
    : path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  claudeDesktop: ENV.isDev
    ? path.join(__dirname, '..', '..', 'dev-config', 'claude-desktop.json')
    : path.join(os.homedir(), 'Library', 'Application Support', 'Claude-Desktop', 'config', 'mcp.json'),
  vscode: ENV.isDev
    ? path.join(__dirname, '..', '..', 'dev-config', 'vscode.json')
    : path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json')
};

/**
 * Configuration path manager
 */
export class ConfigPathManager {
  private static instance: ConfigPathManager;
  private customPaths: Partial<ConfigPaths> = {};

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigPathManager {
    if (!this.instance) {
      this.instance = new ConfigPathManager();
    }
    return this.instance;
  }

  /**
   * Set custom path for a configuration key
   */
  setPath(key: keyof ConfigPaths, path: string): void {
    if (!path) {
      throw new ValidationError(`Invalid path for ${key}`);
    }
    this.customPaths[key] = path;
  }

  /**
   * Get path for a configuration key
   */
  getPath(key: keyof ConfigPaths): string {
    return this.customPaths[key] ?? DEFAULT_PATHS[key];
  }

  /**
   * Reset custom path for a configuration key
   */
  resetPath(key: keyof ConfigPaths): void {
    delete this.customPaths[key];
  }

  /**
   * Reset all custom paths
   */
  resetAllPaths(): void {
    this.customPaths = {};
  }

  /**
   * Get all configuration paths
   */
  getAllPaths(): ConfigPaths {
    return {
      ...DEFAULT_PATHS,
      ...this.customPaths
    };
  }
}

/**
 * Export singleton instance
 */
export const configPaths = ConfigPathManager.getInstance();

// Export default paths for direct access
export { DEFAULT_PATHS }; 