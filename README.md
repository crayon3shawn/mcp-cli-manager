# MCP CLI 管理器

MCP CLI 管理器是一個用於管理 Model Context Protocol (MCP) 伺服器的命令行工具。它提供了簡單的界面來安裝、啟動、停止和管理 MCP 伺服器。

## 功能特點

- 自動偵測已安裝的 MCP 伺服器
- 支援多種客戶端配置（Cursor、Claude Desktop、Cline VSCode、GoMCP）
- 提供友好的命令行界面
- 支援多種安裝方式（直接安裝、NPX、Smithery）
- 進程管理和狀態監控

## 安裝

```bash
npm install -g mcp-cli-manager
```

## 使用方法

### 列出已安裝的伺服器

```bash
mcp-cli-manager list
```

選項：
- `-f, --format <type>`: 輸出格式（table/json/list）

### 啟動伺服器

```bash
mcp-cli-manager start <server>
```

選項：
- `-s, --silent`: 靜默模式運行

### 停止伺服器

```bash
mcp-cli-manager stop [server]
```

如果不指定伺服器名稱，將停止所有運行中的伺服器。

### 安裝新伺服器

```bash
mcp-cli-manager install <server>
```

選項：
- `-c, --client <name>`: 客戶端名稱（預設：cursor）
- `-s, --smithery`: 使用 smithery 工具安裝

### 卸載伺服器

```bash
mcp-cli-manager uninstall <server>
```

選項：
- `-c, --client <name>`: 客戶端名稱（預設：cursor）
- `--keep-config`: 保留配置文件

### 查看伺服器狀態

```bash
mcp-cli-manager status [server]
```

如果不指定伺服器名稱，將顯示所有伺服器的狀態。

## 支援的伺服器

- github: GitHub MCP 伺服器
- package-version: 套件版本檢查伺服器
- bedrock: Amazon Bedrock MCP 伺服器

## 配置文件位置

- Cursor: `~/.cursor/mcp.json`
- Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Cline VSCode: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- GoMCP: `~/.config/gomcp/config.yaml`

## 開發

1. 克隆倉庫：
```bash
git clone https://github.com/your-username/mcp-cli-manager.git
cd mcp-cli-manager
```

2. 安裝依賴：
```bash
npm install
```

3. 運行測試：
```bash
npm test
```

## 貢獻

歡迎提交 Pull Request 或開 Issue 來改進這個工具。

## 授權

MIT 