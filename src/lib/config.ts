/**
 * MCP Configuration Module
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { z } from 'zod';
import { globalConfigSchema, jsonReadOptionsSchema, jsonWriteOptionsSchema } from './schemas.ts';

// Configuration directory
const CONFIG_DIR = join(homedir(), '.mcp');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// Default configuration
const DEFAULT_CONFIG = {
  servers: {}
};

/**
 * Read JSON file
 */
export const readJson = async <T extends z.ZodType>(
  filePath: string,
  schema: T,
  options?: z.infer<typeof jsonReadOptionsSchema>
): Promise<z.infer<T>> => {
  try {
    const content = await readFile(filePath, {
      encoding: options?.encoding || 'utf8'
    });
    const data = JSON.parse(content, options?.reviver);
    return schema.parse(data);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`讀取 JSON 檔案失敗: ${error.message}`);
    }
    throw new Error('讀取 JSON 檔案時發生未知錯誤');
  }
};

/**
 * Write JSON file
 */
export const writeJson = async <T extends z.ZodType>(
  filePath: string,
  data: z.infer<T>,
  schema: T,
  options?: z.infer<typeof jsonWriteOptionsSchema>
): Promise<void> => {
  try {
    // Validate data
    schema.parse(data);

    // Create directory if needed
    if (options?.ensureDirectory) {
      await mkdir(filePath.split('/').slice(0, -1).join('/'), { recursive: true });
    }

    // Write file
    const content = JSON.stringify(data, options?.replacer, options?.spaces);
    await writeFile(filePath, content, {
      encoding: options?.encoding || 'utf8'
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`寫入 JSON 檔案失敗: ${error.message}`);
    }
    throw new Error('寫入 JSON 檔案時發生未知錯誤');
  }
};

/**
 * Get global configuration
 */
export const getGlobalConfig = async (): Promise<z.infer<typeof globalConfigSchema>> => {
  try {
    return await readJson(CONFIG_FILE, globalConfigSchema);
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return DEFAULT_CONFIG;
    }
    throw error;
  }
};

/**
 * Save global configuration
 */
export const saveGlobalConfig = async (config: z.infer<typeof globalConfigSchema>): Promise<void> => {
  await writeJson(CONFIG_FILE, config, globalConfigSchema, {
    spaces: 2,
    ensureDirectory: true
  });
};

export default {
  readJson,
  writeJson,
  getGlobalConfig,
  saveGlobalConfig
}; 