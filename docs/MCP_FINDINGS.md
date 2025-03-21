# MCP 伺服器管理的發現與原則

本文檔記錄了我們在開發 MCP CLI 管理器過程中的發現和設計原則，作為後續開發的參考。

## MCP 伺服器安裝位置模式

1. **直接執行檔路徑**：
   - 完整路徑，如：`/opt/homebrew/bin/mcp-server-github`
   - 通常是透過全局安裝的 npm 包或其他方式直接安裝在系統上

2. **通過 npx 動態執行**：
   - 命令形式：`npx -y <package-name>`
   - 例如：`npx -y mcp-package-version`
   - 不需要預先安裝，每次都會下載最新版本

3. **臨時 npx 緩存**：
   - 路徑：`~/.npm/_npx/<hash>/node_modules/<package-name>`
   - 執行檔：`~/.npm/_npx/<hash>/node_modules/.bin/<command-name>`

## MCP 配置文件位置

客戶端 | 配置文件路徑
--- | ---
Cursor | `~/.cursor/mcp.json`
Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json`
Cline VSCode | `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
GoMCP | `~/.config/gomcp/config.yaml`

## MCP 配置文件格式

```json
{
  "mcpServers": {
    "server-name": {
      "command": "執行檔路徑或命令",
      "args": [參數列表],
      "env": {
        "環境變量名稱": "值"
      }
    }
  }
}
```

## 伺服器管理工具參考

1. **Smithery CLI** (`@smithery/cli`):
   - 安裝：`npx -y @smithery/cli install <server-name> --client <client-name>`
   - 列出：`npx -y @smithery/cli list`
   - 查看：`npx -y @smithery/cli inspect <server-name>`

2. **其他伺服器特定的安裝方式**:
   - 有些伺服器有自己的安裝命令，如 `npx -y @tengfone/supabase-nextjs-mcp-server --client claude`

## 我們的實現計劃

我們將依序實現以下功能：

1. **偵測功能**：掃描系統中已安裝的 MCP 伺服器
2. **列出功能**：顯示已安裝的 MCP 伺服器列表
3. **管理功能**：啟動/停止伺服器、查看狀態
4. **安裝功能**：安裝新的 MCP 伺服器

## 參考配置文件示例

### Cursor 配置文件 (~/.cursor/mcp.json)

```json
{
  "mcpServers": {
    "github": {
      "command": "/opt/homebrew/bin/mcp-server-github",
      "args": [],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_token_value"
      }
    },
    "package-version": {
      "command": "npx",
      "args": ["-y", "mcp-package-version"]
    }
  }
}
``` 