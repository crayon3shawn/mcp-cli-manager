#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Output prefixes
OK_PREFIX="${GREEN}[OK]${NC}"
ERROR_PREFIX="${RED}[ERROR]${NC}"
WARN_PREFIX="${YELLOW}[WARN]${NC}"
INFO_PREFIX="[INFO]"

# Configuration paths
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
CURSOR_CONFIG=".cursor/mcp/config.json"
DEFAULT_CONFIG="servers.conf"

# Helper functions
log_info() {
    echo -e "${INFO_PREFIX} $1"
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
    echo -e "${WARN_PREFIX} $1"
}

check_dependencies() {
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed" \
                 "Command 'jq' not found" \
                 "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
        exit 1
    fi
}

check_existing_configs() {
    local found=0
    if [ -f "$CLAUDE_CONFIG" ]; then
        log_success "Found Claude config: $CLAUDE_CONFIG"
        found=1
    fi
    
    if [ -f "$CURSOR_CONFIG" ]; then
        log_success "Found Cursor config: $CURSOR_CONFIG"
        found=1
    fi
    
    return $found
}

import_config() {
    local source_file=$1
    if [ ! -f "$source_file" ]; then
        echo -e "${CROSS_MARK} Config file not found: $source_file"
        exit 1
    fi
    
    # Convert to our format using jq
    jq -r '.mcpServers | to_entries | map({
        name: .key,
        command: .value.command,
        args: (.value.args // []),
        description: (.value.description // "")
    })' "$source_file" > "$DEFAULT_CONFIG"
    
    echo -e "${CHECK_MARK} Configuration imported successfully"
}

list_servers() {
    if [ ! -f "$DEFAULT_CONFIG" ]; then
        echo -e "${CROSS_MARK} No configuration file found"
        exit 1
    fi
    
    echo "Configured servers:"
    jq -r '.[] | "\\n\(.name):\\n  Command: \(.command)\\n  Args: \(.args | join(" "))\\n  Description: \(.description)"' "$DEFAULT_CONFIG"
}

start_server() {
    local server_name=$1
    if [ -z "$server_name" ]; then
        echo -e "${CROSS_MARK} Server name required"
        exit 1
    fi
    
    # Get server config
    local server_config=$(jq -r ".[] | select(.name == \"$server_name\")" "$DEFAULT_CONFIG")
    if [ -z "$server_config" ]; then
        echo -e "${CROSS_MARK} Server not found: $server_name"
        exit 1
    fi
    
    # Extract command and args
    local command=$(echo "$server_config" | jq -r '.command')
    local args=$(echo "$server_config" | jq -r '.args | join(" ")')
    
    # Start server
    nohup $command $args > /tmp/mcp-$server_name.log 2>&1 &
    echo -e "${CHECK_MARK} Started server: $server_name (PID: $!)"
}

stop_server() {
    local server_name=$1
    if [ -z "$server_name" ]; then
        echo -e "${CROSS_MARK} Server name required"
        exit 1
    }
    
    # Find process
    local pid=$(ps aux | grep "$server_name" | grep -v grep | awk '{print $2}')
    if [ -z "$pid" ]; then
        echo -e "${CROSS_MARK} Server not running: $server_name"
        exit 1
    fi
    
    # Stop server
    kill $pid
    echo -e "${CHECK_MARK} Stopped server: $server_name"
}

# Main command handling
case "$1" in
    "init")
        check_dependencies
        check_existing_configs
        ;;
    "import")
        check_dependencies
        if [ -z "$2" ]; then
            echo -e "${CROSS_MARK} Please specify config file path"
            exit 1
        fi
        import_config "$2"
        ;;
    "list")
        check_dependencies
        list_servers
        ;;
    "start")
        check_dependencies
        start_server "$2"
        ;;
    "stop")
        check_dependencies
        stop_server "$2"
        ;;
    *)
        echo "Usage: $0 {init|import|list|start|stop}"
        exit 1
        ;;
esac 