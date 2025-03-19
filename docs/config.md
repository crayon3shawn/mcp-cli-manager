# Configuration

## File Location

The configuration file follows XDG specification:
- Default: `~/.config/mcp/config.yaml`
- Override with `MCP_CONFIG_DIR` environment variable

## Format

```yaml
# Server configurations
servers:
  server-name:
    command: executable
    args: [arg1, arg2]
    cwd: /path/to/working/directory
    env:
      KEY: value

# Global settings
settings:
  log_level: info
  log_dir: ~/.local/share/mcp/logs
```

## Configuration Options

### Server Options
- `command`: Required. The executable to run
- `args`: Optional. Array of command arguments
- `cwd`: Optional. Working directory
- `env`: Optional. Environment variables

### Global Settings
- `log_level`: debug|info|warn|error
- `log_dir`: Path to log directory 