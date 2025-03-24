export * from './types';
export * from './utils';

import { type ServerConfig, type ServerStatus } from './types';
import { validateServerConfig, checkServerStatus } from './utils';

export async function installServer(config: ServerConfig): Promise<void> {
  validateServerConfig(config);
  // TODO: Implement server installation
}

export async function uninstallServer(config: ServerConfig): Promise<void> {
  validateServerConfig(config);
  // TODO: Implement server uninstallation
}

export async function runServer(config: ServerConfig): Promise<void> {
  validateServerConfig(config);
  // TODO: Implement server run
}

export async function stopServer(config: ServerConfig): Promise<void> {
  validateServerConfig(config);
  // TODO: Implement server stop
}

export async function getServerStatus(config: ServerConfig): Promise<ServerStatus> {
  validateServerConfig(config);
  return checkServerStatus(config);
}

export async function searchServers(query: string): Promise<ServerConfig[]> {
  // TODO: Implement server search
  return [];
}

export async function listServers(): Promise<ServerConfig[]> {
  // TODO: Implement server listing
  return [];
} 