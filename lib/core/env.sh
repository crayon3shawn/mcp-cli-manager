#!/bin/bash
#
# Environment variables management module for MCP CLI Manager
# Responsible for setting up and managing environment variables,
# directory structures, and configurations.
#
# Dependencies:
#   - bash >= 4.0
#   - mkdir
#   - rm
#   - env
#
# Usage:
#   source ./env.sh
#   or
#   ./env.sh {init|validate|info|clean|export}

set -euo pipefail
IFS=$'\n\t'

# Get script directory and load constants
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
source "${SCRIPT_DIR}/constants.sh"

# Base directories configuration
if [ -n "${MCP_TEST:-}" ]; then
    # Test environment
    export MCP_CONFIG_DIR="${MCP_CONFIG_DIR:-$PROJECT_ROOT/test/fixtures}"
    export MCP_LOG_DIR="${MCP_LOG_DIR:-$PROJECT_ROOT/test/logs}"
    export MCP_RUNTIME_DIR="${MCP_RUNTIME_DIR:-$PROJECT_ROOT/test/run}"
    export MCP_ENV="test"
else
    # Production environment
    export MCP_CONFIG_DIR="${MCP_CONFIG_DIR:-$DEFAULT_CONFIG_DIR}"
    export MCP_LOG_DIR="${MCP_LOG_DIR:-$DEFAULT_LOG_DIR}"
    export MCP_RUNTIME_DIR="${MCP_RUNTIME_DIR:-$DEFAULT_RUN_DIR}"
    export MCP_ENV="${MCP_ENV:-production}"
fi

# Application configuration
export MCP_LOG_LEVEL="${MCP_LOG_LEVEL:-$LOG_LEVEL_INFO}"
export MCP_LOG_MAX_SIZE="${MCP_LOG_MAX_SIZE:-10M}"
export MCP_LOG_KEEP_DAYS="${MCP_LOG_KEEP_DAYS:-7}"

# Runtime configuration
export MCP_PID_DIR="${MCP_PID_DIR:-$MCP_RUNTIME_DIR/pid}"

#######################################
# Validates if required environment variables are set
# Globals:
#   MCP_CONFIG_DIR
#   MCP_LOG_DIR
#   MCP_RUNTIME_DIR
#   MCP_ENV
# Arguments:
#   None
# Returns:
#   0 if all required variables are set
#   1 if any variable is missing
#######################################
validate_env() {
    local required_vars=(
        "MCP_CONFIG_DIR"
        "MCP_LOG_DIR"
        "MCP_RUNTIME_DIR"
        "MCP_ENV"
    )

    local missing=0
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            echo "ERROR: Missing required environment variable: $var" >&2
            missing=1
        fi
    done

    return $missing
}

#######################################
# Initializes environment by creating necessary directory structure
# Globals:
#   MCP_CONFIG_DIR
#   MCP_LOG_DIR
#   MCP_RUNTIME_DIR
#   MCP_ENV
#   MCP_PID_DIR
# Arguments:
#   None
# Returns:
#   None
#######################################
init_env() {
    local dirs=(
        "$MCP_CONFIG_DIR"
        "$MCP_LOG_DIR"
        "$MCP_RUNTIME_DIR"
        "$MCP_PID_DIR"
    )

    # Create required directories
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            echo "Created directory: $dir"
        fi
    done

    # Load environment specific configuration
    local env_file="$MCP_CONFIG_DIR/$ENV_FILE_NAME.$MCP_ENV"
    if [ -f "$env_file" ]; then
        echo "Loading environment configuration: $env_file"
        # shellcheck source=/dev/null
        source "$env_file"
    fi

    # Validate environment
    validate_env
}

#######################################
# Gets environment information
# Globals:
#   MCP_ENV
#   MCP_CONFIG_DIR
#   MCP_LOG_DIR
#   MCP_RUNTIME_DIR
#   MCP_LOG_LEVEL
# Arguments:
#   None
# Returns:
#   None
# Output:
#   Prints environment information to stdout
#######################################
get_env_info() {
    cat << EOF
MCP Environment Information:
==========================
Environment: $MCP_ENV
Config Directory: $MCP_CONFIG_DIR
Log Directory: $MCP_LOG_DIR
Runtime Directory: $MCP_RUNTIME_DIR
Log Level: $MCP_LOG_LEVEL
EOF
}

#######################################
# Cleans environment (useful for testing)
# Globals:
#   MCP_RUNTIME_DIR
#   MCP_LOG_DIR
# Arguments:
#   None
# Returns:
#   None
#######################################
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

#######################################
# Exports environment variables to a file
# Globals:
#   MCP_CONFIG_DIR
# Arguments:
#   $1 - Output file path (optional)
# Returns:
#   None
#######################################
export_env() {
    local output_file=${1:-"$MCP_CONFIG_DIR/$ENV_FILE_NAME"}
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$output_file")"
    
    # Export all MCP_ prefixed variables
    env | grep '^MCP_' > "$output_file"
    echo "Exported environment variables to: $output_file"
}

# Main program
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