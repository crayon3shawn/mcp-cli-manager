#!/bin/bash

# Import utility functions
source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

# Configuration file paths
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
CURSOR_CONFIG=".cursor/mcp/config.json"

# Create new configuration
create_config() {
    local config_file=${1:-$MCP_CONFIG_PATH}
    local config_dir=$(dirname "$config_file")
    
    # Create configuration directory
    mkdir -p "$config_dir"
    
    # Create basic configuration
    cat > "$config_file" << EOF
{
    "version": "1.0.0",
    "mcpServers": {}
}
EOF
    
    log_success "Created new config file: $config_file"
    return 0
}

# Check existing configurations
check_existing_configs() {
    local found=0
    
    # Check default configuration
    if [ -f "$MCP_CONFIG_PATH" ]; then
        if validate_json "$MCP_CONFIG_PATH"; then
            log_success "Found default config: $MCP_CONFIG_PATH"
            found=1
        else
            log_warn "Invalid default config found: $MCP_CONFIG_PATH"
        fi
    fi
    
    # Check Claude configuration
    if [ -f "$CLAUDE_CONFIG" ]; then
        if validate_json "$CLAUDE_CONFIG"; then
            log_success "Found Claude config: $CLAUDE_CONFIG"
            found=1
        else
            log_warn "Invalid Claude config found: $CLAUDE_CONFIG"
        fi
    fi
    
    # Check Cursor configuration
    if [ -f "$CURSOR_CONFIG" ]; then
        if validate_json "$CURSOR_CONFIG"; then
            log_success "Found Cursor config: $CURSOR_CONFIG"
            found=1
        else
            log_warn "Invalid Cursor config found: $CURSOR_CONFIG"
        fi
    fi
    
    if [ $found -eq 0 ]; then
        log_info "No existing configurations found"
        log_info "Creating new config file..."
        create_config
    fi
    
    return $found
}

# Import configuration
import_config() {
    local source_file=$1
    local target_file=${2:-$MCP_CONFIG_PATH}
    
    # Check source file
    if [ ! -f "$source_file" ]; then
        log_error "Config file not found" \
                 "File does not exist: $source_file" \
                 "Check the file path and try again"
        return 1
    fi
    
    # Validate JSON format
    if ! validate_json "$source_file"; then
        return 1
    fi
    
    # Backup target file
    if [ -f "$target_file" ]; then
        backup_file "$target_file"
    fi
    
    # Convert and save configuration
    local temp_file=$(mktemp)
    if ! jq '{
        version: "1.0.0",
        mcpServers: (.mcpServers | map_values({
            command: .command,
            args: (.args // []),
            description: (.description // "")
        }))
    }' "$source_file" > "$temp_file"; then
        log_error "Failed to convert config" \
                 "Error while processing JSON" \
                 "Check if the source file has the correct structure"
        rm -f "$temp_file"
        return 1
    fi
    
    # Move to target location
    mv "$temp_file" "$target_file"
    log_success "Configuration imported successfully to $target_file"
    return 0
}

# List servers
list_servers() {
    local config_file=${1:-$MCP_CONFIG_PATH}
    
    # Check configuration file
    if [ ! -f "$config_file" ]; then
        log_error "No configuration file found" \
                 "File does not exist: $config_file" \
                 "Run 'mcp init' or 'mcp import' first"
        return 1
    fi
    
    # Validate JSON format
    if ! validate_json "$config_file"; then
        return 1
    fi
    
    # Display configuration information
    local version
    version=$(jq -r '.version' "$config_file")
    log_info "Configuration version: $version"
    
    # Display server list
    log_info "Configured servers:"
    jq -r '.mcpServers | to_entries[] | "  \(.key):\n    Command: \(.value.command)\n    Args: \(.value.args | join(" "))\n    Description: \(.value.description)\n"' "$config_file"
    
    return 0
}

# Get server configuration
get_server_config() {
    local server_name=$1
    local config_file=${2:-$MCP_CONFIG_PATH}
    
    # Check parameters
    if [ -z "$server_name" ]; then
        log_error "No server name provided" \
                 "Server name is required" \
                 "Provide a server name as argument"
        return 1
    fi
    
    # Check configuration file
    if [ ! -f "$config_file" ]; then
        log_error "Configuration file not found" \
                 "File does not exist: $config_file" \
                 "Run 'mcp init' or 'mcp import' first"
        return 1
    fi
    
    # Get server configuration
    local server_config
    server_config=$(jq -r ".mcpServers[\"$server_name\"]" "$config_file")
    
    if [ "$server_config" = "null" ]; then
        log_error "Server not found" \
                 "No configuration found for server: $server_name" \
                 "Check server name or list available servers with 'mcp list'"
        return 1
    fi
    
    echo "$server_config"
    return 0
} 