#!/bin/bash

# Default values
DEFAULT_CONFIG_DIR="${HOME}/.config/mcp"
DEFAULT_LOG_DIR="/tmp/mcp/logs"

# Color definitions
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Output prefixes
OK_PREFIX="${GREEN}[OK]${NC}"
ERROR_PREFIX="${RED}[ERROR]${NC}"
WARN_PREFIX="${YELLOW}[WARN]${NC}"
INFO_PREFIX="[INFO]"

# Logging functions
log_info() {
    local level=${MCP_LOG_LEVEL:-info}
    [[ $level =~ ^(info|debug)$ ]] && echo -e "${INFO_PREFIX} $1"
}

log_success() {
    echo -e "${OK_PREFIX} $1"
}

log_error() {
    echo -e "${ERROR_PREFIX} $1"
    [ ! -z "$2" ] && echo "Reason: $2"
    [ ! -z "$3" ] && echo "Solution: $3"
}

log_warn() {
    local level=${MCP_LOG_LEVEL:-info}
    [[ $level =~ ^(info|debug|warn)$ ]] && echo -e "${WARN_PREFIX} $1"
}

log_debug() {
    local level=${MCP_LOG_LEVEL:-info}
    [[ $level == "debug" ]] && echo -e "${INFO_PREFIX} [DEBUG] $1"
}

# Environment checks
check_dependencies() {
    local missing=0

    # Check jq
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed" \
                 "Command 'jq' not found" \
                 "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
        missing=1
    fi

    # Check node
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed" \
                 "Command 'node' not found" \
                 "Install Node.js from https://nodejs.org/"
        missing=1
    else
        local node_version=$(node --version)
        log_debug "Found Node.js version: $node_version"
    fi

    return $missing
}

# Initialize directories
init_directories() {
    # Create config directory
    if [ ! -d "$DEFAULT_CONFIG_DIR" ]; then
        mkdir -p "$DEFAULT_CONFIG_DIR"
        log_debug "Created config directory: $DEFAULT_CONFIG_DIR"
    fi

    # Create logs directory
    if [ ! -d "$DEFAULT_LOG_DIR" ]; then
        mkdir -p "$DEFAULT_LOG_DIR"
        log_debug "Created log directory: $DEFAULT_LOG_DIR"
    fi
}

# Load environment variables
load_env() {
    # Set default values
    export MCP_LOG_LEVEL=${MCP_LOG_LEVEL:-info}
    export MCP_CONFIG_PATH=${MCP_CONFIG_PATH:-$DEFAULT_CONFIG_DIR/servers.json}

    # Load .env file if exists
    if [ -f ".env" ]; then
        log_debug "Loading environment variables from .env"
        set -a
        source .env
        set +a
    else
        log_debug "No .env file found, using default environment"
    fi

    # Validate environment variables
    log_debug "Using config path: $MCP_CONFIG_PATH"
    log_debug "Using log level: $MCP_LOG_LEVEL"
}

# Validate JSON
validate_json() {
    local file=$1
    if ! jq empty "$file" 2>/dev/null; then
        log_error "Invalid JSON format in $file" \
                 "File contains invalid JSON syntax" \
                 "Check the file content and fix JSON syntax errors"
        return 1
    fi
    
    # Check required fields
    if ! jq -e '.version' "$file" > /dev/null 2>&1; then
        log_error "Invalid config format" \
                 "Missing required field: version" \
                 "Add version field to the config file"
        return 1
    fi
    
    if ! jq -e '.mcpServers' "$file" > /dev/null 2>&1; then
        log_error "Invalid config format" \
                 "Missing required field: mcpServers" \
                 "Add mcpServers field to the config file"
        return 1
    fi
    
    return 0
}

# Backup file
backup_file() {
    local file=$1
    local backup="${file}.bak"
    
    if [ -f "$file" ]; then
        cp "$file" "$backup"
        log_debug "Created backup: $backup"
        return 0
    fi
    
    return 1
} 