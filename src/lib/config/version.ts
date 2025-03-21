/**
 * Configuration Version Management
 */

import { ValidationError } from '../errors.js';
import type { GlobalConfig } from '../types.js';

/**
 * Versioned configuration interface
 */
export interface VersionedConfig<T> {
  version: number;
  data: T;
}

/**
 * Migration function type
 */
export type MigrationFn<T> = (config: T) => Promise<T>;

/**
 * Configuration migrator class
 */
export class ConfigMigrator<T> {
  private migrations: MigrationFn<T>[] = [];
  private currentVersion = 0;

  /**
   * Add a new migration
   */
  addMigration(migration: MigrationFn<T>): void {
    this.migrations.push(migration);
    this.currentVersion++;
  }

  /**
   * Get current version
   */
  getCurrentVersion(): number {
    return this.currentVersion;
  }

  /**
   * Check if migration is needed
   */
  needsMigration(version: number): boolean {
    return version < this.currentVersion;
  }

  /**
   * Migrate configuration to latest version
   */
  async migrate(config: T, fromVersion: number): Promise<T> {
    if (fromVersion > this.currentVersion) {
      throw new ValidationError(
        `Invalid version: ${fromVersion}. Latest version is ${this.currentVersion}`
      );
    }

    let currentConfig = config;
    for (let i = fromVersion; i < this.migrations.length; i++) {
      currentConfig = await this.migrations[i](currentConfig);
    }
    return currentConfig;
  }
}

/**
 * Global configuration migrator instance
 */
export const globalConfigMigrator = new ConfigMigrator<GlobalConfig>();

// Add migrations here
globalConfigMigrator.addMigration(async (config) => {
  // Migration from version 0 to 1
  // Convert old format to new format
  return {
    ...config,
    mcpServers: {
      ...config.mcpServers,
      // Add any necessary transformations
    }
  };
});

// Example of another migration
globalConfigMigrator.addMigration(async (config) => {
  // Migration from version 1 to 2
  // Add new fields or transform existing ones
  return {
    ...config,
    // Add new fields or transform existing ones
  };
}); 