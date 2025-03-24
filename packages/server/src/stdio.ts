import { ServerConfig } from '@mcp-cli-manager/shared';

export class StdioServer {
  constructor(private config: ServerConfig) {
    this.setupStdioServer();
  }

  private setupStdioServer() {
    process.stdin.on('data', (data: Buffer) => {
      const message = data.toString().trim();
      // Handle incoming messages
      console.log('Received message:', message);
    });
  }

  public send(message: string) {
    process.stdout.write(message + '\n');
  }

  public close() {
    process.stdin.end();
  }
} 