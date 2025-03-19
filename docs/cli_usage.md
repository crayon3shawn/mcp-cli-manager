# CLI Usage Guide

## Basic Commands

```zsh
mcp <command> [options]

Commands:
  init                    Initialize configuration files
  list                    List all configured servers
  get <server>            Display server configuration details
  add <server>            Add a new server configuration
  remove <server>         Remove server configuration
  import <file>           Import configuration file
  start <server>          Start server
  stop <server>           Stop server
  restart <server>        Restart server
  status <server>         Check server status

Options:
  -h, --help            Show help information
  -v, --version         Show version information
```

## Examples

```zsh
# Initialize configuration 
mcp init

# List all configured servers
mcp list

# Start a server
mcp start github

# Stop a server
mcp stop github

# Check server status
mcp status github

# Restart a server
mcp restart github
```

## Configuration Principles

MCP CLI Manager follows these configuration principles:

1. **XDG Base Directory Specification** - Configuration files are stored in standard locations
   - Default: `~/.config/mcp/`
   - Override with `MCP_CONFIG_DIR` environment variable

2. **YAML Format** - All configuration uses YAML format
   - Human-readable structure
   - Hierarchical configuration
   - Easy to edit manually

3. **Environment Variables** - Support for overriding settings
   - Environment variables take precedence over file-based config
   - Use `.env` files for API keys and sensitive information

4. **Server Configuration** - Each server has its own configuration block
   - Unique identifier
   - Command and arguments
   - Working directory
   - Environment specifics

## Environment Variables

- `MCP_CONFIG_DIR`: Override configuration directory
- `MCP_DEBUG`: Enable debug mode (true/false)
- `MCP_LOG_LEVEL`: Set logging level (debug|info|warn|error)
- `MCP_ROOT`: Set the root directory for relative paths

## Exit Codes

- 0: Success
- 1: General error
- 2: Configuration error
- 3: Process management error
- 4: Security validation error 