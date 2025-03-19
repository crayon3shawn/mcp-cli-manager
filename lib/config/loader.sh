#!/bin/bash

# Import core modules
source "${MCP_ROOT}/lib/core/env.sh"
source "${MCP_ROOT}/lib/core/log.sh"

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

# Convert YAML to JSON using yq
yaml_to_json() {
    local yaml_file=$1
    if ! command -v yq &> /dev/null; then
        log_error "yq is not installed. Please install yq first."
        return 1
    }
    yq -o=json eval "$yaml_file"
}

# Validate config schema
validate_config_schema() {
    local config_file=$1
    
    # Check if file exists
    if [ ! -f "$config_file" ]; then
        log_error "Configuration file not found: $config_file"
        return 1
    }
    
    # Convert YAML to JSON for validation
    local config_json
    config_json=$(yaml_to_json "$config_file") || return 1
    
    # Validate using jq
    if ! echo "$config_json" | jq empty 2>/dev/null; then
        log_error "Invalid YAML/JSON syntax in config file"
        return 1
    }
    
    # Check required fields
    local missing_fields=()
    
    # Check global section
    if ! echo "$config_json" | jq -e '.global' >/dev/null; then
        missing_fields+=("global")
    fi
    
    # Check servers section
    if ! echo "$config_json" | jq -e '.servers' >/dev/null; then
        missing_fields+=("servers")
    fi
    
    # Check paths section
    if ! echo "$config_json" | jq -e '.paths' >/dev/null; then
        missing_fields+=("paths")
    fi
    
    if [ ${#missing_fields[@]} -gt 0 ]; then
        log_error "Missing required fields in config: ${missing_fields[*]}"
        return 1
    }
    
    return 0
}

# Get server configuration
get_server_config() {
    local server_name=$1
    local config_file="${MCP_CONFIG_FILE:-config.yaml}"
    
    # Convert YAML to JSON and extract server config
    local config_json
    config_json=$(yaml_to_json "$config_file") || return 1
    
    # Get server configuration
    local server_config
    server_config=$(echo "$config_json" | jq -r --arg name "$server_name" '.servers[$name]')
    
    if [ "$server_config" = "null" ]; then
        log_error "Server configuration not found: $server_name"
        return 1
    fi
    
    echo "$server_config"
    return 0
}

# List configured servers
list_servers() {
    local config_file="${MCP_CONFIG_FILE:-config.yaml}"
    local config_json
    
    config_json=$(yaml_to_json "$config_file") || return 1
    
    # Get all server names and their status
    echo "Configured Servers:"
    echo "-----------------"
    echo "$config_json" | jq -r '.servers | keys[]' | while read -r server_name; do
        local description
        local status
        
        description=$(echo "$config_json" | jq -r --arg name "$server_name" '.servers[$name].description // "No description"')
        status=$(get_server_status "$server_name")
        
        printf "%-20s %-10s %s\n" "$server_name" "[$status]" "$description"
    done
    
    return 0
} 