#!/bin/bash

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Base directories configuration
# MCP_HOME: Base directory for all MCP related files
# Can be overridden by setting MCP_HOME environment variable
export MCP_HOME="${MCP_HOME:-$HOME/.mcp}"
export MCP_CONFIG_DIR="${MCP_CONFIG_DIR:-$PROJECT_ROOT/conf}"
export MCP_LOG_DIR="${MCP_LOG_DIR:-$PROJECT_ROOT/logs}"
export MCP_RUNTIME_DIR="${MCP_RUNTIME_DIR:-$PROJECT_ROOT/run}"
export MCP_BACKUP_DIR="${MCP_BACKUP_DIR:-$MCP_HOME/backups}"

# Application configuration
export MCP_ENV="${MCP_ENV:-production}"
export MCP_LOG_LEVEL="${MCP_LOG_LEVEL:-1}"
export MCP_CONFIG_FILE="${MCP_CONFIG_FILE:-$MCP_CONFIG_DIR/servers.json}"
export MCP_LOG_MAX_SIZE="${MCP_LOG_MAX_SIZE:-10M}"
export MCP_LOG_KEEP_DAYS="${MCP_LOG_KEEP_DAYS:-7}"

# Runtime configuration
export MCP_PID_DIR="${MCP_PID_DIR:-$MCP_RUNTIME_DIR/pid}"
export MCP_SOCKET_DIR="${MCP_SOCKET_DIR:-$MCP_RUNTIME_DIR/sockets}"

# Validate required environment variables
validate_env() {
    local required_vars=(
        "MCP_HOME"
        "MCP_CONFIG_DIR"
        "MCP_LOG_DIR"
        "MCP_RUNTIME_DIR"
        "MCP_ENV"
    )

    local missing=0
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "ERROR: Missing required environment variable: $var" >&2
            missing=1
        fi
    done

    return $missing
}

# Initialize environment
init_env() {
    local dirs=(
        "$MCP_HOME"
        "$MCP_CONFIG_DIR"
        "$MCP_LOG_DIR"
        "$MCP_RUNTIME_DIR"
        "$MCP_BACKUP_DIR"
        "$MCP_PID_DIR"
        "$MCP_SOCKET_DIR"
    )

    # Create required directories
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            echo "Created directory: $dir"
        fi
    done

    # Load environment specific configuration
    local env_file="$MCP_CONFIG_DIR/.env.$MCP_ENV"
    if [ -f "$env_file" ]; then
        echo "Loading environment configuration: $env_file"
        # shellcheck source=/dev/null
        source "$env_file"
    fi

    # Validate environment
    validate_env
}

# Get environment information
get_env_info() {
    cat << EOF
MCP Environment Information:
==========================
Environment: $MCP_ENV
Home Directory: $MCP_HOME
Config Directory: $MCP_CONFIG_DIR
Log Directory: $MCP_LOG_DIR
Runtime Directory: $MCP_RUNTIME_DIR
Backup Directory: $MCP_BACKUP_DIR
Log Level: $MCP_LOG_LEVEL
Config File: $MCP_CONFIG_FILE
EOF
}

# Clean environment (useful for testing)
clean_env() {
    local dirs=(
        "$MCP_RUNTIME_DIR"
        "$MCP_LOG_DIR"
    )

    for dir in "${dirs[@]}"; do
        if [ -d "$dir" ]; then
            rm -rf "$dir"
            echo "Cleaned directory: $dir"
        fi
    done
}

# Export environment variables to a file
export_env() {
    local output_file=${1:-"$MCP_CONFIG_DIR/.env"}
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$output_file")"
    
    # Export all MCP_ prefixed variables
    env | grep '^MCP_' > "$output_file"
    echo "Exported environment variables to: $output_file"
}

# Main
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-}" in
        "init")
            init_env
            ;;
        "validate")
            validate_env
            ;;
        "info")
            get_env_info
            ;;
        "clean")
            clean_env
            ;;
        "export")
            export_env "${2:-}"
            ;;
        *)
            echo "Usage: ${0} {init|validate|info|clean|export}" >&2
            exit 1
            ;;
    esac
fi 