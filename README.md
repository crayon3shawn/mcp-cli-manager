# MCP CLI Manager

[English](#english) | [繁體中文](#繁體中文)

---

# English

## Introduction

MCP CLI Manager is a command-line tool for managing multiple server processes.

## Features

- Process management (start, stop, restart)
- Process monitoring
- Resource cleanup
- Node.js environment validation

## Installation

```bash
npm install -g mcp-cli-manager
```

## Usage

```bash
mcp start server-name
mcp stop server-name
mcp restart server-name
mcp status server-name
```

## Configuration

Create `config.yaml` in your configuration directory:

```yaml
servers:
  app1:
    name: "Application 1"
    command: "node app.js"
    working_dir: "./app1"
    enabled: true
```

## License

MIT License

---

# 繁體中文

## 簡介

MCP CLI Manager 是一個用於管理多個伺服器進程的命令列工具。

## 功能特點

- 進程管理（啟動、停止、重啟）
- 進程監控
- 資源清理
- Node.js 環境驗證

## 安裝

```bash
npm install -g mcp-cli-manager
```

## 使用方式

```bash
mcp start server-name
mcp stop server-name
mcp restart server-name
mcp status server-name
```

## 配置

在配置目錄中創建 `config.yaml`：

```yaml
servers:
  app1:
    name: "應用程式 1"
    command: "node app.js"
    working_dir: "./app1"
    enabled: true
```

## 授權條款

MIT 授權

## 功能特點

- 多服務器管理
- 進程監控
- 日誌管理
- 配置管理
- 安全性驗證

## 安裝

### 快速安裝（推薦）

```bash
# 使用 curl 安裝
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/crayon3shawn/mcp-cli-manager/main/scripts/install.sh)"

# 或使用 wget 安裝
/bin/bash -c "$(wget -qO- https://raw.githubusercontent.com/crayon3shawn/mcp-cli-manager/main/scripts/install.sh)"
```

### 從源碼安裝

```bash
git clone https://github.com/crayon3shawn/mcp-cli-manager.git
cd mcp-cli-manager
make install
```

## 系統要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- git
- curl

## 配置

安裝過程中會引導您創建初始配置，或者您可以之後運行 `mcp init` 來創建。

### 服務器配置 (servers.yaml)

```yaml
# MCP CLI Manager 服務器配置
# 要啟用服務器，請移除 enabled: false 的註釋

servers:
  my-server:
    #enabled: false  # 取消註釋以啟用服務器
    name: "我的服務器"
    description: "這是一個示例服務器"
    command: "node server.js"
    working_dir: "/path/to/server"
    env:
      NODE_ENV: "production"
      PORT: "3000"
    #ports:
    #  - 3000
    #health_check:
    #  url: "http://localhost:3000/health"
    #  interval: "5s"
    #  timeout: "3s"
    #  retries: 3
```

### 全局配置 (config.yaml)

```yaml
# MCP CLI Manager 全局配置
# 取消註釋以啟用相應功能

logging:
  #level: info
  #format: text
  #file: mcp.log
  #max_size: 10MB
  #max_files: 5

process:
  find_method: pgrep
  name_pattern: "%s"
  #start_timeout: 30s
  #stop_timeout: 30s
  #health_check_interval: 5s
  #stop_signals:
  #  - signal: SIGTERM
  #    wait: 5s
  #  - signal: SIGKILL
  #    wait: 0s
```

### 環境變量 (.env)

```bash
# MCP CLI Manager 環境變量
# 取消註釋並填入您的 API 密鑰

#ANTHROPIC_API_KEY=your_key_here
#OPENAI_API_KEY=your_key_here
#GITHUB_API_TOKEN=your_token_here
```

## 使用方法

```bash
# 初始化配置
mcp init

# 列出所有服務器
mcp list

# 啟動服務器
mcp start my-server

# 停止服務器
mcp stop my-server

# 重啟服務器
mcp restart my-server

# 查看服務器狀態
mcp status my-server

# 查看幫助信息
mcp --help
```

## 開發指南

### 環境設置

1. 克隆倉庫：
```bash
git clone https://github.com/crayon3shawn/mcp-cli-manager.git
cd mcp-cli-manager
```

2. 安裝依賴：
```bash
npm install
```

3. 準備開發環境：
```bash
cp config.yaml.example config.yaml
cp servers.yaml.example servers.yaml
cp .env.example .env
mkdir -p temp/logs
```

### 開發模式運行

```bash
make dev
```

### 運行測試

```bash
make test
```

## 文檔

詳細文檔請參考 [docs/](docs/) 目錄：

- [使用指南](docs/guides/cli.md)
- [配置說明](docs/guides/config.md)
- [開發指南](docs/guides/development.md)

## 許可證

[MIT](LICENSE)

## 目錄結構

```