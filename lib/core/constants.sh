#!/bin/bash
#
# Constants and default values for MCP CLI Manager
# This file defines all constant values used throughout the application.
#
# Dependencies:
#   None
#
# Usage:
#   source ./constants.sh

set -euo pipefail
IFS=$'\n\t'

#######################################
# Version Information
#######################################
MCP_VERSION="1.0.0"

#######################################
# Default Directory Paths
# Following XDG Base Directory Specification
#######################################
DEFAULT_CONFIG_DIR="${HOME}/.config/mcp-cli-manager"
DEFAULT_LOG_DIR="${HOME}/.local/share/mcp-cli-manager/logs"
DEFAULT_RUN_DIR="${HOME}/.local/share/mcp-cli-manager/run"

#######################################
# File Names and Extensions
#######################################
CONFIG_FILE_NAME="servers.conf"
ENV_FILE_NAME=".env"
PID_FILE_SUFFIX=".pid"
LOG_FILE_SUFFIX=".log"

#######################################
# Exit Status Codes
#######################################
EXIT_SUCCESS=0
EXIT_FAILURE=1
EXIT_CONFIG_ERROR=2
EXIT_PERMISSION_ERROR=3
EXIT_DEPENDENCY_ERROR=4
EXIT_PROCESS_ERROR=5

#######################################
# Operation Timeouts (in seconds)
#######################################
DEFAULT_START_TIMEOUT=30
DEFAULT_STOP_TIMEOUT=15
DEFAULT_CHECK_INTERVAL=5

#######################################
# Process States
#######################################
STATE_RUNNING="running"
STATE_STOPPED="stopped"
STATE_ERROR="error"

#######################################
# Log Levels
#######################################
LOG_LEVEL_DEBUG=0
LOG_LEVEL_INFO=1
LOG_LEVEL_WARN=2
LOG_LEVEL_ERROR=3

#######################################
# Required Configuration Fields
#######################################
REQUIRED_CONFIG_FIELDS=(
    "name"     # Unique server identifier
    "command"  # Command to start the server
    "args"     # Command arguments
) 