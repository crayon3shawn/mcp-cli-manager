# MCP CLI Manager

[English](#english) | [中文](#中文)

<a name="中文"></a>
# MCP CLI Manager

一個用於管理 MCP Server 的命令行工具。

## 功能特點

- 註冊和管理 MCP Server
- 支持 npx 和 binary 類型的服務器
- 自動日誌記錄和管理
- 服務器狀態監控
- 全局和本地配置管理
- 服務器搜索功能

## 安裝

### 使用 npm

```bash
npm install -g mcp-cli-manager
```

### 使用 Homebrew

```bash
brew tap crayon3shawn/tap
brew install mcp-cli-manager
```

## 使用方法

### 註冊 MCP Server

```bash
mcp regist <name>
```

例如：
```bash
mcp register github 
```

### 啟動 MCP Server

```bash
mcp start <name>
```

### 停止 MCP Server

```bash
mcp stop <name>
```

### 停止所有 MCP Server

```bash
mcp stop
```

### 查看 MCP Server 狀態

```bash
mcp status
```

### 列出所有 MCP Server

```bash
mcp list
```

### 搜索 MCP Server

```bash
mcp search <query>
```

### 同步 MCP Server 配置

```bash
mcp sync
```

## 配置

配置文件位於：
- 全局配置：`~/.cursor/config/global.json`
- Cursor 配置：`~/.cursor/config/cursor.json`

## 日誌

服務器日誌位於：`~/.cursor/logs/<server-name>.log`

## 開發

```bash
# 安裝依賴
npm install

# 構建
npm run build

# 運行測試
npm test
```

---

<a name="english"></a>
# MCP CLI Manager

A command-line tool for managing MCP Servers.

## Features

- Register and manage MCP Servers
- Support for npx and binary server types
- Automatic logging and management
- Server status monitoring
- Global and local configuration management
- Server search functionality

## Installation

### Using npm

```bash
npm install -g mcp-cli-manager
```

### Using Homebrew

```bash
brew tap crayon3shawn/tap
brew install mcp-cli-manager
```

## Usage

### Register MCP Server

```bash
mcp register <name> 
```

Example:
```bash
mcp register github 
```

### Start MCP Server

```bash
mcp start <name>
```

### Stop MCP Server

```bash
mcp stop <name>
```

### Stop All MCP Servers

```bash
mcp stop
```

### Check MCP Server Status

```bash
mcp status
```

### List All MCP Servers

```bash
mcp list
```

### Search MCP Servers

```bash
mcp search <query>
```

### Sync MCP Server Configuration

```bash
mcp sync
```

## Configuration

Configuration files are located at:
- Global config: `~/.cursor/config/global.json`
- Cursor config: `~/.cursor/config/cursor.json`

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```