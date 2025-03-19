#!/bin/bash
#
# Configuration loader module for MCP CLI Manager
# Handles configuration file loading, parsing, and validation
#
# Dependencies:
#   - bash >= 4.0
#
# Usage:
#   source ./loader.sh

set -euo pipefail
IFS=$'\n\t'

# Import core modules
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../core/env.sh"
source "${SCRIPT_DIR}/../core/log.sh"

# Configuration file paths
CONFIG_DIR="${MCP_CONFIG_DIR:-$DEFAULT_CONFIG_DIR}"
CONFIG_FILE="$CONFIG_DIR/config.yaml"
SERVERS_FILE="$CONFIG_DIR/servers.yaml"
ENV_FILE="$CONFIG_DIR/.env"

# Array to store parsed configuration
declare -A CONFIG_VARS

#######################################
# Parse YAML file
# Arguments:
#   $1 - YAML file path
#   $2 - Prefix (optional)
# Returns:
#   0 if parsing successful
#   1 if parsing failed
#######################################
parse_yaml() {
    local file=$1
    local prefix=${2:-}
    local current_key=""
    local current_value=""
    local in_array=0
    local array_key=""
    local array_index=0
    local line
    local key
    local value
    
    # Check if file exists
    if [ ! -f "$file" ]; then
        log_error "Configuration file not found" "File: $file"
        return 1
    }
    
    # Clear configuration array
    CONFIG_VARS=()
    
    # Read file line by line
    while IFS= read -r line; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        
        # Remove leading spaces
        while [[ "$line" =~ ^[[:space:]] ]]; do
            line="${line# }"
        done
        
        # Handle array items
        if [[ "$line" =~ ^-[[:space:]] ]]; then
            if [ $in_array -eq 0 ]; then
                array_key="$current_key"
                array_index=0
                in_array=1
            fi
            line="${line#- }"
            CONFIG_VARS["${prefix}${array_key}_${array_index}"]="$line"
            ((array_index++))
            continue
        fi
        
        # Handle key-value pairs
        if [[ "$line" =~ ^([^:]+):[[:space:]]*(.*)$ ]]; then
            # Save previous key-value pair
            if [ -n "$current_key" ]; then
                CONFIG_VARS["${prefix}${current_key}"]="$current_value"
            fi
            
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            in_array=0
            
            # Remove quotes
            while [[ "$value" =~ ^[\'\"] ]]; do
                value="${value#[\'\"]}"
            done
            while [[ "$value" =~ [\'\"]$ ]]; do
                value="${value%[\'\"]}"
            done
            
            current_key="$key"
            current_value="$value"
        fi
    done < "$file"
    
    # Save last key-value pair
    if [ -n "$current_key" ]; then
        CONFIG_VARS["${prefix}${current_key}"]="$current_value"
    fi
    
    return 0
}

#######################################
# Get configuration value
# Arguments:
#   $1 - Configuration key
# Returns:
#   Configuration value
#######################################
get_config() {
    local key=$1
    echo "${CONFIG_VARS[$key]:-}"
}

#######################################
# Validate server configuration
# Arguments:
#   $1 - Server name
# Returns:
#   0 if configuration is valid
#   1 if configuration is invalid
#######################################
validate_server_config() {
    local server_name=$1
    local field
    local enabled
    
    # Check required fields
    local required_fields=(
        "name"
        "command"
        "enabled"
    )
    
    for field in "${required_fields[@]}"; do
        if [ -z "$(get_config "servers_${server_name}_${field}")" ]; then
            log_error "Missing required field" \
                     "Server: $server_name" \
                     "Field: $field" \
                     "Add '$field:' to the server configuration"
            return 1
        fi
    done
    
    # Validate field values
    enabled=$(get_config "servers_${server_name}_enabled")
    if [ "$enabled" != "true" ] && [ "$enabled" != "false" ]; then
        log_error "Invalid enabled value" \
                 "Server: $server_name" \
                 "Value: $enabled" \
                 "Must be 'true' or 'false'"
        return 1
    fi
    
    return 0
}

#######################################
# Get server configuration
# Arguments:
#   $1 - Server name
# Returns:
#   Server configuration
#######################################
get_server_config() {
    local server_name=$1
    local key
    local enabled
    
    # Check if configuration file exists
    if [ ! -f "$SERVERS_FILE" ]; then
        log_error "Server configuration file not found" \
                 "Expected file: $SERVERS_FILE" \
                 "Run 'mcp init' to create configuration files"
        return 1
    fi
    
    # Parse configuration file
    parse_yaml "$SERVERS_FILE" || return 1
    
    # Check if server exists
    if [ -z "$(get_config "servers_${server_name}_name")" ]; then
        log_error "Server configuration not found" \
                 "Server: $server_name" \
                 "Check configuration file: $SERVERS_FILE"
        return 1
    fi
    
    # Validate configuration
    validate_server_config "$server_name" || return 1
    
    # Check if server is enabled
    enabled=$(get_config "servers_${server_name}_enabled")
    if [ "$enabled" = "false" ]; then
        log_error "Server is disabled" \
                 "Server: $server_name" \
                 "Edit $SERVERS_FILE and set enabled: true to enable it"
        return 1
    fi
    
    # Output configuration
    for key in "${!CONFIG_VARS[@]}"; do
        if [[ "$key" =~ ^servers_${server_name}_ ]]; then
            echo "${key#servers_${server_name}_}=${CONFIG_VARS[$key]}"
        fi
    done
    
    return 0
}

#######################################
# List configured servers
# Arguments:
#   None
# Returns:
#   0 if listing successful
#   1 if listing failed
#######################################
list_servers() {
    local key
    local server_name
    local description
    local status
    local enabled
    
    # Check if configuration file exists
    if [ ! -f "$SERVERS_FILE" ]; then
        log_error "Server configuration file not found" \
                 "Expected file: $SERVERS_FILE" \
                 "Run 'mcp init' to create configuration files"
        return 1
    fi
    
    echo "Configured Servers:"
    echo "-----------------"
    
    # Parse configuration file
    parse_yaml "$SERVERS_FILE" || return 1
    
    # List all servers
    for key in "${!CONFIG_VARS[@]}"; do
        if [[ "$key" =~ ^servers_(.*)_name$ ]]; then
            server_name="${BASH_REMATCH[1]}"
            description=$(get_config "servers_${server_name}_description")
            enabled=$(get_config "servers_${server_name}_enabled")
            
            if [ "$enabled" = "false" ]; then
                status="disabled"
            elif [ -n "$MCP_TEST" ]; then
                status="stopped"
            else
                status=$(get_server_status "$server_name")
            fi
            
            printf "%-20s %-10s %-10s %s\n" \
                   "$server_name" \
                   "[$status]" \
                   "[$enabled]" \
                   "${description:-No description}"
        fi
    done
    
    return 0
} 