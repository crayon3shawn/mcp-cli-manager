#!/bin/bash

# Import core modules
source "$(dirname "${BASH_SOURCE[0]}")/../core/env.sh"
source "$(dirname "${BASH_SOURCE[0]}")/../core/log.sh"

# Configuration file paths
if [ -n "$MCP_TEST" ]; then
    CONFIG_DIR="${MCP_CONFIG_DIR:-$PWD/test/fixtures}"
else
    CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/mcp-cli-manager"
fi

CONFIG_FILE="$CONFIG_DIR/config.yaml"
SERVERS_FILE="$CONFIG_DIR/servers.yaml"
ENV_FILE="$CONFIG_DIR/.env"

# Create new configuration
create_config() {
    mkdir -p "$CONFIG_DIR"
    
    if [ ! -f "$CONFIG_FILE" ]; then
        cp "config.yaml.example" "$CONFIG_FILE"
    fi
    
    if [ ! -f "$SERVERS_FILE" ]; then
        cp "servers.yaml.example" "$SERVERS_FILE"
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        cp ".env.example" "$ENV_FILE"
    fi
    
    log_success "Configuration files created in $CONFIG_DIR"
    return 0
}

# Initialize configuration
init_config() {
    if [ -f "$CONFIG_FILE" ] || [ -f "$SERVERS_FILE" ] || [ -f "$ENV_FILE" ]; then
        log_warn "Configuration files already exist"
        read -p "Do you want to overwrite them? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing configuration"
            return 0
        fi
    fi
    
    create_config
}

# Parse YAML file
parse_yaml() {
    local file=$1
    local prefix=$2
    local s='[[:space:]]*'
    local w='[a-zA-Z0-9_]*'
    
    # 只讀取未註釋的行
    sed -e 's/#.*$//' -e '/^$/d' "$file" | \
    sed -ne "s|^\($s\):|\1|" \
         -e "s|^\($s\)\($w\)$s:$s[\"']\(.*\)[\"']$|\1$prefix\2=\"\3\"|p" \
         -e "s|^\($s\)\($w\)$s:$s\(.*\)$|\1$prefix\2=\"\3\"|p"
}

# Get server configuration
get_server_config() {
    local server_name=$1
    local config_file="$SERVERS_FILE"
    
    if [ ! -f "$config_file" ]; then
        log_error "Servers configuration file not found" \
                 "Expected file: $config_file" \
                 "Run 'mcp init' to create configuration files"
        return 1
    fi
    
    # 解析 YAML 配置
    local config
    while IFS= read -r line; do
        config="$config\n$line"
    done < <(parse_yaml "$config_file")
    
    # 檢查服務器是否啟用
    local enabled
    enabled=$(echo -e "$config" | grep "^servers_${server_name}_enabled=" | cut -d'"' -f2)
    if [ "$enabled" = "false" ]; then
        log_error "Server is disabled" \
                 "Server: $server_name" \
                 "Edit $config_file and set enabled: true to enable it"
        return 1
    fi
    
    # 獲取服務器配置
    local server_config
    server_config=$(echo -e "$config" | grep "^servers_${server_name}_" | sed "s/^servers_${server_name}_//")
    
    if [ -z "$server_config" ]; then
        log_error "Server configuration not found: $server_name"
        return 1
    fi
    
    echo "$server_config"
    return 0
}

# List configured servers
list_servers() {
    local config_file="$SERVERS_FILE"
    
    if [ ! -f "$config_file" ]; then
        log_error "Servers configuration file not found" \
                 "Expected file: $config_file" \
                 "Run 'mcp init' to create configuration files"
        return 1
    fi
    
    echo "Configured Servers:"
    echo "-----------------"
    
    # 解析並顯示服務器列表
    local config
    while IFS= read -r line; do
        config="$config\n$line"
    done < <(parse_yaml "$config_file")
    
    echo -e "$config" | grep "^servers_.*_name=" | while read -r line; do
        local server_name
        local description
        local status
        local enabled
        
        server_name=$(echo "$line" | sed -E 's/^servers_(.*)_name=.*$/\1/')
        description=$(echo -e "$config" | grep "^servers_${server_name}_description=" | cut -d'"' -f2)
        enabled=$(echo -e "$config" | grep "^servers_${server_name}_enabled=" | cut -d'"' -f2)
        
        if [ "$enabled" = "false" ]; then
            status="disabled"
        elif [ -n "$MCP_TEST" ]; then
            status="stopped"
        else
            status=$(get_server_status "$server_name")
        fi
        
        printf "%-20s %-10s %-10s %s\n" "$server_name" "[$status]" "[$enabled]" "${description:-No description}"
    done
    
    return 0
} 