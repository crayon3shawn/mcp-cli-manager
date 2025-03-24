import { describe, it, expect } from 'vitest';
import { validateServerConfig, checkServerStatus } from './index';
import { type ServerConfig } from '../types';

describe('utils', () => {
  describe('validateServerConfig', () => {
    it('should validate server config', () => {
      const config: ServerConfig = {
        name: 'test-server',
        port: 8080,
        host: 'localhost',
        type: 'minecraft',
        username: 'admin',
        password: 'password'
      };
      expect(() => validateServerConfig(config)).not.toThrow();
    });

    it('should throw error for invalid server config', () => {
      const config = {
        name: 'test-server',
        port: 8080
      };
      expect(() => validateServerConfig(config as ServerConfig)).toThrow();
    });
  });

  describe('checkServerStatus', () => {
    it('should check server status', async () => {
      const config: ServerConfig = {
        name: 'test-server',
        port: 8080,
        host: 'localhost',
        type: 'minecraft',
        username: 'admin',
        password: 'password'
      };
      const status = await checkServerStatus(config);
      expect(status).toBeDefined();
    });
  });
}); 