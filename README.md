# MCP CLI Manager

A command-line tool for managing and monitoring MCP (Model Context Protocol) servers.

## Features

- List installed MCP servers
- Search for available MCP servers
- Register new MCP servers
- Monitor server status
- Start and stop servers
- Support for multiple server types (binary, npx)

## Requirements

- Node.js >= 14.0.0
- npm >= 6.0.0

## Installation

You can install MCP CLI Manager using either npm or Homebrew:

### Using npm

```bash
npm install -g mcp-cli-manager
```

### Using Homebrew

```bash
brew tap crayon3shawn/mcp-cli-manager
brew install mcp-cli-manager
```

## Usage

### List installed servers

```bash
mcp list
```

### Search for available servers

```bash
mcp search <query>
```

### Register a new server

```bash
mcp regist <server-name>
```

### Check server status

```bash
mcp status [server-name]
```

### Start servers

Start all servers:
```bash
mcp run
```

Start specific servers:
```bash
mcp run server1 server2
```

### Stop servers

Stop all servers:
```bash
mcp stop
```

Stop specific servers:
```bash
mcp stop server1 server2
```

## Server Types

### Binary (bin)
- System-level binary installation
- Usually installed via package managers (e.g., Homebrew)
- Fast startup and better performance

### NPX
- Executed through npm packages
- No global installation required
- Suitable for temporary use or testing

## Configuration

Server configurations are stored in the global configuration file:

```yaml
servers:
  github:
    type: bin
    command: /opt/homebrew/bin/mcp-server-github
  sequential-thinking:
    type: npx
    command: npx
    args: ["-y", "@modelcontextprotocol/server-sequential-thinking"]
```

## Development

1. Clone the repository:
```bash
git clone https://github.com/crayon3shawn/mcp-cli-manager.git
cd mcp-cli-manager
```

2. Install dependencies:
```bash
npm install
```

3. Run development version:
```bash
npm start
```

## License

MIT License 