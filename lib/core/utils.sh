#!/bin/bash
#
# Utility functions for MCP CLI Manager
# Provides common utility functions for file operations,
# environment checks, and configuration validation.
#
# Dependencies:
#   - bash >= 4.0
#   - mkdir
#   - cp
#   - yq (optional, for YAML validation)
#
# Usage:
#   source ./utils.sh

set -euo pipefail
IFS=$'\n\t'

# Get script directory and load dependencies
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/constants.sh"
source "${SCRIPT_DIR}/log.sh"

#######################################
# Check if required commands are available
# Verifies system dependencies and optional tools
#######################################
check_dependencies() {
    local missing=0

    # Check yq (optional)
    if ! command -v yq &> /dev/null; then
        log_warn "yq is not installed. YAML validation will be basic."
    fi

    return $missing
}

#######################################
# Initialize required directories
# Creates default configuration, log and runtime directories
#######################################
init_directories() {
    local dirs=(
        "$DEFAULT_CONFIG_DIR"
        "$DEFAULT_LOG_DIR"
        "$DEFAULT_RUN_DIR"
    )

    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_debug "Created directory: $dir"
        fi
    done
}

#######################################
# Load environment variables from file
# Loads configuration from .env file if exists
#######################################
load_env() {
    local env_file="$DEFAULT_CONFIG_DIR/$ENV_FILE_NAME"

    if [ -f "$env_file" ]; then
        log_debug "Loading environment variables from $env_file"
        # shellcheck source=/dev/null
        source "$env_file"
    else
        log_debug "No $ENV_FILE_NAME file found, using default environment"
    fi
}

#######################################
# Validate YAML configuration file
# Arguments:
#   $1 - Path to YAML file
#######################################
validate_config() {
    local file=$1
    local valid=0

    # Check if file exists
    if [ ! -f "$file" ]; then
        log_error "Configuration file not found: $file"
        return 1
    fi

    # Basic YAML validation
    if command -v yq &> /dev/null; then
        if ! yq eval '.' "$file" > /dev/null 2>&1; then
            log_error "Invalid YAML format in $file" \
                     "File contains invalid YAML syntax" \
                     "Check the file content and fix YAML syntax errors"
            return 1
        fi
    else
        # Basic syntax check without yq
        if ! grep -E "^[[:space:]]*[^[:space:]#].*:.*$" "$file" > /dev/null 2>&1; then
            log_error "File does not appear to be valid YAML: $file"
            return 1
        fi
    fi

    # Check required fields
    for field in "${REQUIRED_CONFIG_FIELDS[@]}"; do
        if ! grep -E "^[[:space:]]*${field}:" "$file" > /dev/null 2>&1; then
            log_error "Missing required field in config: $field" \
                     "Configuration must include '$field' field" \
                     "Add '$field:' with appropriate value to the config file"
            valid=1
        fi
    done

    return $valid
}

#######################################
# Create backup of a file
# Arguments:
#   $1 - Path to file
# Returns:
#   Backup file path if successful
#######################################
backup_file() {
    local file=$1
    local timestamp
    timestamp=$(date "+%Y%m%d_%H%M%S")
    local backup="${file}.${timestamp}.bak"
    
    if [ -f "$file" ]; then
        cp "$file" "$backup"
        log_debug "Created backup: $backup"
        return 0
    fi
    
    log_warn "Cannot create backup: source file not found: $file"
    return 1
}

#######################################
# Check if a process is running
# Arguments:
#   $1 - Process ID
#######################################
is_process_running() {
    local pid=$1
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0
    fi
    return 1
}

#######################################
# Get process ID by name pattern
# Arguments:
#   $1 - Process name pattern
# Returns:
#   Process ID if found, empty string otherwise
#   Process ID if found
#   Empty string if not found
#######################################
get_process_id() {
    local pattern=$1
    local pid
    pid=$(pgrep -f "$pattern" 2>/dev/null)
    echo "$pid"
} 