import { WebSocket, WebSocketServer as WSServer } from 'ws';
import { type ServerConfig } from '@mcp-cli-manager/core';

export class WebSocketServer {
  private wss: WSServer | null = null;
  private clients: Map<string, WebSocket> = new Map();

  constructor(private config: ServerConfig) {}

  public start(): void {
    if (this.wss) {
      return;
    }

    this.wss = new WSServer({ port: this.config.port });
    this.setupWebSocketServer();
  }

  public stop(): void {
    if (!this.wss) {
      return;
    }

    this.wss.close();
    this.wss = null;
    this.clients.clear();
  }

  private setupWebSocketServer() {
    if (!this.wss) {
      return;
    }

    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = Math.random().toString(36).substring(7);
      this.clients.set(clientId, ws);

      ws.on('message', (message: string) => {
        // Handle incoming messages
        console.log(`Received message from client ${clientId}:`, message);
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
      });
    });
  }

  public broadcast(message: string) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
} 