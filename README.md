# MCP CLI Manager

A command-line tool for managing Model Context Protocol (MCP) servers.

MCP 服務器管理命令行工具。

## Features | 功能特點

- Unified server management (start/stop/status)
- Configuration management
- Support for both Claude Desktop and Cursor configurations

- 統一的服務器管理（啟動/停止/狀態）
- 配置文件管理
- 支持 Claude Desktop 和 Cursor 的配置文件

## Installation | 安裝

```bash
npm install -g mcp-cli-manager
```

## Usage | 使用方法

### Initialize Configuration | 初始化配置

```bash
mcp-cli-manager init
```

### Import Existing Configuration | 導入現有配置

```bash
mcp-cli-manager import --from <path>
```

### List Configured Servers | 列出已配置的服務器

```bash
mcp-cli-manager config list
```

## Configuration | 配置

The tool supports multiple configuration sources:
- Claude Desktop configuration
- Cursor configuration
- Custom configuration

支持多種配置來源：
- Claude Desktop 配置
- Cursor 配置
- 自定義配置

Configuration files are stored in:
- Project level: `./servers.conf`
- User level: `~/.config/mcp-cli-manager/servers.conf`

配置文件存放位置：
- 項目級別：`./servers.conf`
- 用戶級別：`~/.config/mcp-cli-manager/servers.conf`

## Development | 開發

```bash
# Clone the repository | 克隆倉庫
git clone https://github.com/yourusername/mcp-cli-manager.git

# Install dependencies | 安裝依賴
cd mcp-cli-manager
npm install

# Run locally | 本地運行
npm start
```

## License | 許可證

MIT 