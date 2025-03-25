# MCP CLI Manager

A command-line tool for managing Model Context Protocol (MCP) servers, with support for various server types and connection methods.

## Features

- Manage multiple MCP servers
- Support for different server types:
  - Windsurf
  - Cline
  - Custom servers
- Easy server installation and management
- Status monitoring and control
- TypeScript support with full type safety

## Installation

### Using Homebrew

```bash
brew tap crayon3shawn/homebrew-tap
brew install mcp-cli-manager
```

### Using npm

```bash
npm install -g mcp-cli-manager
```

## Usage

```bash
# List all installed servers
mcp-cli-manager list

# Install a new server
mcp-cli-manager install <server-name>

# Start a server
mcp-cli-manager run <server-name>

# Stop a server
mcp-cli-manager stop <server-name>

# Check server status
mcp-cli-manager status <server-name>
```

## Development

This project uses pnpm as the package manager and is structured as a monorepo:

```
mcp-cli-manager/
├── packages/
│   ├── core/           # Core functionality
│   ├── cli/            # CLI tool
│   ├── server/         # Server-related code
│   ├── config/         # Configuration management
│   └── shared/         # Shared utilities and types
├── pnpm-workspace.yaml
└── package.json
```

### Prerequisites

- Node.js 20.x
- pnpm 8.x
- Git

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/crayon3shawn/mcp-cli-manager.git
   cd mcp-cli-manager
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the project:
   ```bash
   pnpm build
   ```

### Development Commands

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Format code
pnpm format
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the MCP community for their feedback and suggestions

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
