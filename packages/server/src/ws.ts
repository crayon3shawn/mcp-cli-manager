import { WebSocket } from 'ws';
import { ServerConfig } from '@mcp-cli-manager/shared';

export class WebSocketServer {
  private wss: WebSocket.Server;
  private clients: Map<string, WebSocket> = new Map();

  constructor(private config: ServerConfig) {
    this.wss = new WebSocket.Server({ port: config.port });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
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

  public close() {
    this.wss.close();
  }
} 