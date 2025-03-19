#!/bin/bash

# Version
readonly MCP_VERSION="1.0.0"

# Default paths
readonly DEFAULT_CONFIG_DIR="${HOME}/.config/mcp-cli-manager"
readonly DEFAULT_LOG_DIR="${HOME}/.local/share/mcp-cli-manager/logs"
readonly DEFAULT_RUN_DIR="${HOME}/.local/share/mcp-cli-manager/run"

# File names
readonly CONFIG_FILE_NAME="servers.conf"
readonly ENV_FILE_NAME=".env"
readonly PID_FILE_SUFFIX=".pid"
readonly LOG_FILE_SUFFIX=".log"

# Exit codes
readonly EXIT_SUCCESS=0
readonly EXIT_FAILURE=1
readonly EXIT_CONFIG_ERROR=2
readonly EXIT_PERMISSION_ERROR=3
readonly EXIT_DEPENDENCY_ERROR=4
readonly EXIT_PROCESS_ERROR=5

# Timeouts (in seconds)
readonly DEFAULT_START_TIMEOUT=30
readonly DEFAULT_STOP_TIMEOUT=15
readonly DEFAULT_CHECK_INTERVAL=5

# Process states
readonly STATE_RUNNING="running"
readonly STATE_STOPPED="stopped"
readonly STATE_UNKNOWN="unknown"
readonly STATE_ERROR="error"

# Log levels
readonly LOG_LEVEL_DEBUG=0
readonly LOG_LEVEL_INFO=1
readonly LOG_LEVEL_WARN=2
readonly LOG_LEVEL_ERROR=3

# Server types
readonly SERVER_TYPE_CLAUDE="claude"
readonly SERVER_TYPE_CURSOR="cursor"
readonly SERVER_TYPE_CUSTOM="custom"

# Configuration fields
readonly REQUIRED_CONFIG_FIELDS=(
    "name"
    "type"
    "command"
    "workDir"
) 