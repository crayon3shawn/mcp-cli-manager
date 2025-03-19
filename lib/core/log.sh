#!/bin/bash
#
# Logging module for MCP CLI Manager
# Provides functions for console logging with different levels
#
# Dependencies:
#   - bash >= 4.0
#
# Usage:
#   source ./log.sh

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
# Log debug message
#######################################
log_debug() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_DEBUG" ]; then
        echo -e "${COLOR_BLUE}[DEBUG]${COLOR_RESET} $1" >&2
    fi
}

#######################################
# Log info message
#######################################
log_info() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_INFO" ]; then
        echo -e "[INFO] $1" >&2
    fi
}

#######################################
# Log warning message
#######################################
log_warn() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_WARN" ]; then
        echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $1" >&2
    fi
}

#######################################
# Log error message
#######################################
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

#######################################
# Log success message
#######################################
log_success() {
    if [ "$CURRENT_LOG_LEVEL" -le "$LOG_LEVEL_INFO" ]; then
        echo -e "${COLOR_GREEN}[OK]${COLOR_RESET} $1" >&2
    fi
}

# Main program
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-}" in
        "init")
            echo "Usage: ${0} {init|rotate}" >&2
            exit 1
            ;;
        "rotate")
            echo "Usage: ${0} {init|rotate}" >&2
            exit 1
            ;;
        *)
            echo "Usage: ${0} {init|rotate}" >&2
            exit 1
            ;;
    esac
fi 