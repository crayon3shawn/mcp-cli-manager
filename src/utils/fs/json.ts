/**
 * JSON File Operations
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';
import { FileSystemError } from '../errors.js';

/**
 * JSON read options
 */
export interface JsonReadOptions {
  readonly encoding?: BufferEncoding;
  readonly reviver?: (key: string, value: any) => any;
}

/**
 * JSON write options
 */
export interface JsonWriteOptions {
  readonly encoding?: BufferEncoding;
  readonly replacer?: (key: string, value: any) => any;
  readonly spaces?: number;
  readonly ensureDirectory?: boolean;
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
    await fs.mkdir(dirname(path), { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw new FileSystemError(`Failed to create directory: ${dirname(path)}`, error);
    }
  }
}

/**
 * Read JSON file
 */
export async function readJson<T>(
  path: string,
  options: JsonReadOptions = {}
): Promise<T | null> {
  try {
    const content = await fs.readFile(path, options.encoding ?? DEFAULT_OPTIONS.encoding);
    return JSON.parse(content, options.reviver) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw new FileSystemError(`Failed to read JSON file: ${path}`, error);
  }
}

/**
 * Write JSON file
 */
export async function writeJson<T>(
  path: string,
  data: T,
  options: JsonWriteOptions = {}
): Promise<void> {
  try {
    const {
      encoding = DEFAULT_OPTIONS.encoding,
      spaces = DEFAULT_OPTIONS.spaces,
      replacer,
      ensureDirectory = DEFAULT_OPTIONS.ensureDirectory
    } = options;

    if (ensureDirectory) {
      await ensureDir(path);
    }

    const content = JSON.stringify(data, replacer, spaces);
    await fs.writeFile(path, content, encoding);
  } catch (error) {
    throw new FileSystemError(`Failed to write JSON file: ${path}`, error);
  }
}

/**
 * Check if JSON file exists
 */
export async function jsonExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
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
    await fs.unlink(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw new FileSystemError(`Failed to delete JSON file: ${path}`, error);
    }
  }
} 