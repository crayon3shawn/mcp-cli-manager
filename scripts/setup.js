#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';

// 顏色輸出函數
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, type = 'info') {
  const color = type === 'success' ? colors.green : type === 'warning' ? colors.yellow : type === 'error' ? colors.red : '';
  console.log(`${color}${message}${colors.reset}`);
}

// 檢查並創建必要的配置文件
function setupConfigFiles() {
  const configFiles = [
    {
      path: '.env.example',
      content: `# MCP CLI Manager 環境配置
NODE_ENV=development
LOG_LEVEL=debug
`
    },
    {
      path: 'config.yaml.example',
      content: `# MCP CLI Manager 配置文件
servers:
  # 服務器配置示例
  example-server:
    type: npx
    command: npx
    args:
      - "-y"
      - "@modelcontextprotocol/server-example"
`
    }
  ];

  configFiles.forEach(file => {
    if (!existsSync(file.path)) {
      writeFileSync(file.path, file.content);
      log(`Created ${file.path}`, 'success');
    }
  });
}

// 檢查並安裝依賴
function checkDependencies() {
  try {
    log('Checking dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    log('Dependencies installed successfully', 'success');
  } catch (error) {
    log('Failed to install dependencies', 'error');
    process.exit(1);
  }
}

// 檢查並設置 Git hooks
function setupGitHooks() {
  const hooksDir = join('.git', 'hooks');
  const preCommitHook = join(hooksDir, 'pre-commit');
  
  const hookContent = `#!/bin/sh
npm run lint
npm test
`;

  if (!existsSync(preCommitHook)) {
    writeFileSync(preCommitHook, hookContent);
    chmodSync(preCommitHook, '755');
    log('Git hooks setup completed', 'success');
  }
}

// 主函數
function main() {
  try {
    log('Setting up development environment...');
    
    setupConfigFiles();
    checkDependencies();
    setupGitHooks();
    
    log('Development environment setup completed! 🎉', 'success');
  } catch (error) {
    log(`Setup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

main(); 