# CLI Usage

## Commands

```bash
mcp <command> [options]

Commands:
  start   <name>     Start a process
  stop    <name>     Stop a process
  restart <name>     Restart a process
  status  [name]     Show process status
  list              List all processes
```

## Examples

```bash
# Start a process
mcp start test-server

# Stop a process
mcp stop test-server

# Check status
mcp status test-server

# List all processes
mcp list
```

## Configuration

```bash
# Location: ~/.config/mcp/config.yaml

servers:
  test-server:
    command: node
    args: ["server.js"]
    cwd: ~/projects/test
```

## Environment Variables

- `MCP_CONFIG_DIR`: Override config directory
- `MCP_LOG_LEVEL`: Set log level (debug|info|warn|error)

## Exit Codes

- 0: Success
- 1: General error
- 2: Configuration error
- 3: Runtime error 