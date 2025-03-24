import { type ServerConfig, type ServerStatus } from '../types';

export function validateServerConfig(config: ServerConfig): void {
  if (!config || typeof config !== 'object') {
    throw new Error('Server config must be an object');
  }
  if (!config.name || typeof config.name !== 'string') {
    throw new Error('Server name is required and must be a string');
  }
  if (!config.port || typeof config.port !== 'number') {
    throw new Error('Server port is required and must be a number');
  }
  if (!config.host || typeof config.host !== 'string') {
    throw new Error('Server host is required and must be a string');
  }
  if (!config.type || typeof config.type !== 'string') {
    throw new Error('Server type is required and must be a string');
  }
  if (!config.username || typeof config.username !== 'string') {
    throw new Error('Server username is required and must be a string');
  }
  if (!config.password || typeof config.password !== 'string') {
    throw new Error('Server password is required and must be a string');
  }
}

export async function checkServerStatus(config: ServerConfig): Promise<ServerStatus> {
  validateServerConfig(config);
  // TODO: Implement actual server status check
  return {
    name: config.name,
    status: 'running',
    uptime: 0,
    players: 0,
    maxPlayers: 0,
    version: 'unknown'
  };
} 