# MCP CLI Manager

MCP 伺服器管理工具，用於管理和監控 MCP（Model Control Protocol）伺服器。

## 功能特點

- 列出已安裝的 MCP 伺服器
- 搜尋可用的 MCP 伺服器
- 安裝新的 MCP 伺服器
- 監控伺服器運行狀態
- 支援多種伺服器類型（bin、npx）

## 系統需求

- Node.js >= 14.0.0
- npm >= 6.0.0

## 安裝

```bash
npm install -g mcp-cli-manager
```

## 使用方法

### 列出已安裝的伺服器

```bash
mcp list
```

### 搜尋可用的伺服器

```bash
mcp search <關鍵字>
```

### 安裝新伺服器

```bash
mcp install <伺服器名稱>
```

### 查看伺服器狀態

```bash
mcp status
```

## 伺服器類型

### Binary (bin)
- 系統級安裝的二進制檔案
- 通常通過套件管理器（如 Homebrew）安裝
- 啟動速度快，性能好

### NPX
- 通過 npm 套件執行
- 不需要全局安裝
- 適合臨時使用或測試

## 配置

伺服器配置存儲在全局配置檔案中：

```yaml
servers:
  github:
    type: bin
    command: /opt/homebrew/bin/mcp-server-github
  package-version:
    type: npx
    command: npx -y mcp-package-version
```

## 開發

1. 克隆專案：
```bash
git clone https://github.com/chengche6230/mcp-cli-manager.git
cd mcp-cli-manager
```

2. 安裝依賴：
```bash
npm install
```

3. 執行開發版本：
```bash
npm start
```

## 授權

MIT License 