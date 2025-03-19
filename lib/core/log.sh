#!/bin/bash
#
# Logging module for MCP CLI Manager
# Provides functions for console and file logging with different levels
# and automatic log rotation.
#
# Dependencies:
#   - bash >= 4.0
#   - mkdir
#   - date
#   - gzip
#   - find
#   - stat
#
# Usage:
#   source ./log.sh
#   or
#   ./log.sh {init|rotate}

set -euo pipefail
IFS=$'\n\t'

# Get script directory and load dependencies
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/env.sh"

# Define colors for console output
COLOR_RESET="\033[0m"
COLOR_RED="\033[0;31m"
COLOR_GREEN="\033[0;32m"
COLOR_YELLOW="\033[0;33m"
COLOR_BLUE="\033[0;34m"

# Get current log level from environment
CURRENT_LOG_LEVEL=${MCP_LOG_LEVEL:-$LOG_LEVEL_INFO}

#######################################
# Initialize logging
# Sets up log directory and file
#######################################
init_logging() {
    # Create log directory
    mkdir -p "$MCP_LOG_DIR"
    
    # Rotate logs if needed
    rotate_logs "$MCP_LOG_DIR/mcp$LOG_FILE_SUFFIX"
    
    log_debug "Logging initialized with level: $MCP_LOG_LEVEL"
}

#######################################
# Log debug message
# Arguments:
#   $1 - Message
#   $2... - Additional context (optional)
#######################################
log_debug() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_DEBUG" ]; then
        echo -e "${COLOR_BLUE}[DEBUG]${COLOR_RESET} $1" >&2
        write_log "DEBUG" "$1"
    fi
}

#######################################
# Log info message
# Arguments:
#   $1 - Message
#   $2... - Additional context (optional)
#######################################
log_info() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_INFO" ]; then
        echo -e "[INFO] $1" >&2
        write_log "INFO" "$1"
    fi
}

#######################################
# Log warning message
# Arguments:
#   $1 - Message
#   $2... - Additional context (optional)
#######################################
log_warn() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_WARN" ]; then
        echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $1" >&2
        write_log "WARN" "$1"
    fi
}

#######################################
# Log error message
# Arguments:
#   $1 - Message
#   $2... - Additional context (optional)
#######################################
log_error() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_ERROR" ]; then
        echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $1" >&2
        write_log "ERROR" "$1"
        
        if [ -n "${2:-}" ]; then
            echo -e "${COLOR_RED}Reason:${COLOR_RESET} $2" >&2
            write_log "ERROR" "Reason: $2"
        fi
        
        if [ -n "${3:-}" ]; then
            echo -e "${COLOR_RED}Solution:${COLOR_RESET} $3" >&2
            write_log "ERROR" "Solution: $3"
        fi
    fi
}

#######################################
# Log success message
# Arguments:
#   $1 - Message
#   $2... - Additional context (optional)
#######################################
log_success() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_INFO" ]; then
        echo -e "${COLOR_GREEN}[OK]${COLOR_RESET} $1" >&2
        write_log "SUCCESS" "$1"
    fi
}

#######################################
# Format log message with timestamp
# Arguments:
#   $1 - Log level
#   $2 - Message
# Returns:
#   Formatted log message
#######################################
format_log_message() {
    local level=$1
    local message=$2
    local timestamp
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $message"
}

#######################################
# Write log message
# Arguments:
#   $1 - Log level
#   $2 - Message
#   $3... - Additional context (optional)
#######################################
write_log() {
    local level=$1
    local message=$2
    local log_file="$MCP_LOG_DIR/mcp$LOG_FILE_SUFFIX"
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$log_file")"
    
    # Write formatted message to log file
    format_log_message "$level" "$message" >> "$log_file"
}

#######################################
# Rotate log file if it exceeds max size
# Globals:
#   MCP_LOG_MAX_SIZE
#   MCP_LOG_KEEP_DAYS
# Arguments:
#   $1 - Log file path
# Returns:
#   None
#######################################
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

# Main program
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-}" in
        "init")
            init_logging
            ;;
        "rotate")
            rotate_logs "$MCP_LOG_DIR/mcp$LOG_FILE_SUFFIX"
            ;;
        *)
            echo "Usage: ${0} {init|rotate}" >&2
            exit 1
            ;;
    esac
fi 