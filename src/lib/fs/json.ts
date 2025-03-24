/**
 * JSON File Operations
 */

import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { dirname } from 'path';
import { FileSystemError } from '../errors.js';

/**
 * JSON read options
 */
export interface JsonReadOptions {
  encoding?: BufferEncoding;
  flag?: string;
}

/**
 * JSON write options
 */
export interface JsonWriteOptions {
  encoding?: BufferEncoding;
  mode?: number;
  flag?: string;
}

/**
 * Default options for JSON operations
 */
const DEFAULT_OPTIONS = {
  encoding: 'utf8' as const,
  spaces: 2,
  ensureDirectory: true
} as const;

/**
 * Ensure directory exists
 */
async function ensureDir(path: string): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Read JSON file
 */
export async function readJson<T = unknown>(
  path: string,
  options: JsonReadOptions = {}
): Promise<T> {
  try {
    await ensureDir(path);
    const content = await readFile(path, options);
    return JSON.parse(content.toString());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' || error instanceof SyntaxError) {
      const emptyConfig = {
        version: 1,
        data: {
          servers: {},
          mcpServers: {}
        }
      };
      await writeJson(path, emptyConfig);
      return emptyConfig as T;
    }
    throw error;
  }
}

/**
 * Write JSON file
 */
export async function writeJson<T = unknown>(
  path: string,
  data: T,
  options: JsonWriteOptions = {}
): Promise<void> {
  await ensureDir(path);
  await writeFile(path, JSON.stringify(data, null, 2), options);
}

/**
 * Check if JSON file exists
 */
export async function jsonExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete JSON file if exists
 */
export async function deleteJson(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
} 