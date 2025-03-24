import {
  type ServerConfig,
  type ServerStatus,
  installServer,
  uninstallServer,
  runServer,
  stopServer,
  getServerStatus,
  searchServers
} from '@mcp-cli-manager/core';
import { WebSocketServer } from './ws';

export {
  type ServerConfig,
  type ServerStatus,
  installServer,
  uninstallServer,
  runServer,
  stopServer,
  getServerStatus,
  searchServers
};

export class Server {
  private wsServer: WebSocketServer;

  constructor(private config: ServerConfig) {
    this.wsServer = new WebSocketServer(config);
  }

  public start(): void {
    this.wsServer.start();
  }

  public stop(): void {
    this.wsServer.stop();
  }

  public broadcast(message: string): void {
    this.wsServer.broadcast(message);
  }
} 