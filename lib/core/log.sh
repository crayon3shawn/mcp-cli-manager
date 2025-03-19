#!/bin/bash

# Import environment configuration
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

# Define log levels
LOG_LEVEL_DEBUG=0
LOG_LEVEL_INFO=1
LOG_LEVEL_WARN=2
LOG_LEVEL_ERROR=3

# Define colors
COLOR_RESET="\033[0m"
COLOR_RED="\033[0;31m"
COLOR_GREEN="\033[0;32m"
COLOR_YELLOW="\033[0;33m"
COLOR_BLUE="\033[0;34m"

# Get current log level from environment or set default
CURRENT_LOG_LEVEL=${MCP_LOG_LEVEL:-$LOG_LEVEL_INFO}

# Logging functions
log_debug() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_DEBUG" ]; then
        echo -e "${COLOR_BLUE}[DEBUG]${COLOR_RESET} $1" >&2
    fi
}

log_info() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_INFO" ]; then
        echo -e "[INFO] $1" >&2
    fi
}

log_warn() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_WARN" ]; then
        echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $1" >&2
    fi
}

log_error() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_ERROR" ]; then
        echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $1" >&2
        if [ -n "${2:-}" ]; then
            echo -e "${COLOR_RED}Reason:${COLOR_RESET} $2" >&2
        fi
        if [ -n "${3:-}" ]; then
            echo -e "${COLOR_RED}Solution:${COLOR_RESET} $3" >&2
        fi
    fi
}

log_success() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_INFO" ]; then
        echo -e "${COLOR_GREEN}[OK]${COLOR_RESET} $1" >&2
    fi
}

# Format log message with timestamp
format_log_message() {
    local level=$1
    local message=$2
    local timestamp
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $message"
}

# Write log message to file
write_log() {
    local level=$1
    local message=$2
    local log_file="$MCP_LOG_DIR/mcp.log"
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$log_file")"
    
    # Write formatted message to log file
    format_log_message "$level" "$message" >> "$log_file"
}

# Rotate logs if needed
rotate_logs() {
    local log_file=$1
    local max_size=${MCP_LOG_MAX_SIZE:-10M}
    
    # Check if log file exists and exceeds max size
    if [ -f "$log_file" ] && [ "$(stat -f%z "$log_file")" -gt "$((${max_size%M} * 1024 * 1024))" ]; then
        local timestamp
        timestamp=$(date "+%Y%m%d_%H%M%S")
        local backup_file="$log_file.$timestamp"
        
        mv "$log_file" "$backup_file"
        gzip "$backup_file"
        
        # Clean old log files
        find "$(dirname "$log_file")" -name "$(basename "$log_file").*" -mtime +"${MCP_LOG_KEEP_DAYS:-7}" -delete
    fi
}

# Initialize logging
init_logging() {
    # Create log directory
    mkdir -p "$MCP_LOG_DIR"
    
    # Rotate logs if needed
    rotate_logs "$MCP_LOG_DIR/mcp.log"
    
    log_debug "Logging initialized with level: $MCP_LOG_LEVEL"
}

# Main
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-}" in
        "init")
            init_logging
            ;;
        "rotate")
            rotate_logs "$MCP_LOG_DIR/mcp.log"
            ;;
        *)
            echo "Usage: ${0} {init|rotate}" >&2
            exit 1
            ;;
    esac
fi 