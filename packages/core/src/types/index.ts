export interface ServerConfig {
  name: string;
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface ServerStatus {
  name: string;
  status: 'online' | 'offline' | 'running';
  uptime: number;
  players: number;
  maxPlayers: number;
  version: string;
} 