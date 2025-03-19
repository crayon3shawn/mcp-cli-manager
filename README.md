# MCP CLI Manager

多服務器進程管理工具，用於管理多個 Node.js 服務器實例。

## 功能特點

- 多服務器管理
- 進程監控
- 日誌管理
- 配置管理
- 安全性驗證

## 安裝

### 快速安裝（推薦）

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/yourusername/mcp-cli-manager/main/scripts/install.sh)"
```

或使用 wget：

```bash
/bin/bash -c "$(wget -qO- https://raw.githubusercontent.com/yourusername/mcp-cli-manager/main/scripts/install.sh)"
```

### 從源碼安裝

```bash
git clone https://github.com/yourusername/mcp-cli-manager.git
cd mcp-cli-manager
make install
```

## 系統要求

- Node.js 18.0.0 或更高版本
- npm 8.0.0 或更高版本
- nvm（推薦）

## 快速開始

1. 初始化配置：
```bash
mcp init
```

2. 啟動服務器：
```bash
mcp start server-name
```

3. 查看狀態：
```bash
mcp status
```

## 開發指南

### 環境設置

1. 克隆倉庫：
```bash
git clone https://github.com/yourusername/mcp-cli-manager.git
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