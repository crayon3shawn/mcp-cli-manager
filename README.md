# MCP CLI Manager

MCP CLI Manager 是一個用於管理 Model Context Protocol (MCP) 服務的命令行工具。

## 功能

- 啟動和停止 MCP 服務
- 查看服務狀態和進程信息
- 支持環境變數配置
- 自動進程管理和日誌記錄

## 安裝

使用 Homebrew 安裝：

```bash
brew tap yourusername/mcp
brew install mcp
```

## 配置

1. 創建配置文件 `~/.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "github": {
      "command": "/opt/homebrew/bin/mcp-server-github",
      "args": [],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

2. （可選）創建 `.env` 文件來存儲敏感信息：

```bash
GITHUB_PERSONAL_ACCESS_TOKEN="your-token-here"
```

## 使用方法

1. 列出所有服務：
```bash
mcp list
```

2. 啟動服務：
```bash
mcp start github
```

3. 停止服務：
```bash
mcp stop github
```

4. 查看幫助：
```bash
mcp help
```

## 日誌

服務日誌存儲在 `~/.cursor/run/` 目錄下，文件名格式為 `{服務名}.log`。

## 依賴

- zsh
- jq
- screen

## 授權

MIT License 