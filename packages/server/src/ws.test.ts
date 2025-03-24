import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebSocketServer } from './ws';
import { type ServerConfig } from '@mcp-cli-manager/core';

describe('WebSocketServer', () => {
  let server: WebSocketServer;
  const config: ServerConfig = {
    name: 'test-server',
    port: 8080,
    host: 'localhost',
    type: 'minecraft',
    username: 'admin',
    password: 'password'
  };

  beforeEach(() => {
    server = new WebSocketServer(config);
  });

  afterEach(() => {
    server.stop();
  });

  it('should create WebSocket server instance', () => {
    expect(server).toBeInstanceOf(WebSocketServer);
  });

  it('should start and stop server', () => {
    expect(() => {
      server.start();
      server.stop();
    }).not.toThrow();
  });

  it('should broadcast message to clients', () => {
    expect(() => {
      server.broadcast('test message');
    }).not.toThrow();
  });
}); 