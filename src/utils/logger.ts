/**
 * MCP Logger Module
 */
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Constants } from './constants.js';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { promises as fs } from 'fs';
import os from 'os';

// 確保日誌目錄存在
if (!existsSync(Constants.PATHS.LOG_DIR)) {
  mkdirSync(Constants.PATHS.LOG_DIR, { recursive: true, mode: Constants.PERMISSIONS.DIR });
}

// 定義日誌格式
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    const baseMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    return stack ? `${baseMessage}\n${stack}` : baseMessage;
  })
);

// 創建 Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 檔案日誌（按日期輪替）
    new DailyRotateFile({
      dirname: Constants.PATHS.LOG_DIR,
      filename: 'mcp-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: Constants.LOG.MAX_SIZE,
      maxFiles: Constants.LOG.MAX_FILES,
      format: logFormat
    }),
    // 控制台輸出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  ]
});

// 進程錯誤處理
process.on('uncaughtException', (error) => {
  logger.error('未捕獲的異常', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('未處理的 Promise 拒絕', reason);
});

// 服務器日誌管理
class ServerLogger {
  private serverName: string;
  private logFile: string;

  constructor(serverName: string) {
    this.serverName = serverName;
    this.logFile = join(Constants.PATHS.LOG_DIR, `${serverName}.log`);
  }

  private formatMessage(message: string): string {
    return `[${this.serverName}] ${message}`;
  }

  info(message: string): void {
    logger.info(this.formatMessage(message));
  }

  error(message: string, error?: Error): void {
    if (error) {
      logger.error(this.formatMessage(message), error);
    } else {
      logger.error(this.formatMessage(message));
    }
  }

  debug(message: string): void {
    logger.debug(this.formatMessage(message));
  }

  warn(message: string): void {
    logger.warn(this.formatMessage(message));
  }

  getLogStream(): winston.Logger {
    return winston.createLogger({
      format: logFormat,
      transports: [
        new winston.transports.File({
          filename: this.logFile,
          maxsize: Constants.LOG.MAX_SIZE,
          maxFiles: Constants.LOG.MAX_FILES,
          tailable: true
        })
      ]
    });
  }
}

export { logger, ServerLogger }; 