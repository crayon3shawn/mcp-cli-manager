#!/bin/bash
#
# Configuration loader module for MCP CLI Manager
# Handles loading, parsing and validating configuration files
#
# Dependencies:
#   - bash >= 4.0
#   - ../core/env.sh: Environment variables
#   - ../core/log.sh: Logging functionality 
#
# Usage:
#   source ./loader.sh

set -euo pipefail
IFS=$'\n\t'

# Get script directory and load dependencies
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../core/env.sh"
source "${SCRIPT_DIR}/../core/log.sh"

# XDG Base Directory Specification
XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
XDG_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
XDG_CACHE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}"

# Configuration directories
CONFIG_DIR="$XDG_CONFIG_HOME/mcp-cli-manager"
DATA_DIR="$XDG_DATA_HOME/mcp-cli-manager"
CACHE_DIR="$XDG_CACHE_HOME/mcp-cli-manager"

# Configuration file paths
CONFIG_FILE="$CONFIG_DIR/config.yaml"
SERVERS_FILE="$CONFIG_FILE"
ENV_FILE="$CONFIG_DIR/.env"
BACKUP_DIR="$DATA_DIR/backups"

# Array to store parsed configuration
declare -A CONFIG_VARS

# Initialize configuration directories
# Creates necessary directory structure with appropriate permissions
init_config_dirs() {
    local dirs=(
        "$CONFIG_DIR"
        "$DATA_DIR"
        "$CACHE_DIR"
        "$BACKUP_DIR"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            chmod 700 "$dir"
        fi
    done
    
    return 0
}

#######################################
# Create default configuration files
# Creates necessary config files if they don't exist
#######################################
create_config() {
    # 確保配置目錄存在
    init_config_dirs
    
    # 創建配置文件，如果不存在
    if [ ! -f "$CONFIG_FILE" ]; then
        cat > "$CONFIG_FILE" << EOF
# MCP CLI Manager 全局配置
# 取消註釋以啟用相應功能

logging:
  level: info
  format: text
  file: mcp.log
  max_size: 10MB
  max_files: 5

process:
  find_method: pgrep
  name_pattern: "%s"
  start_timeout: 30s
  stop_timeout: 30s
  health_check_interval: 5s
  stop_signals:
    - signal: SIGTERM
      wait: 5s
    - signal: SIGKILL
      wait: 0s
EOF
        chmod 644 "$CONFIG_FILE"
        log_info "Created default configuration file: $CONFIG_FILE"
    fi
    
    # 創建服務器配置文件
    if [ ! -f "$SERVERS_FILE" ] || [ "$CONFIG_FILE" != "$SERVERS_FILE" ]; then
        cat > "$SERVERS_FILE" << EOF
# MCP CLI Manager 服務器配置
# 要啟用服務器，請移除 enabled: false 的註釋

servers:
  example-server:
    enabled: false  # 取消註釋以啟用服務器
    name: "Example Server"
    description: "這是一個示例服務器"
    command: "node server.js"
    working_dir: "."
    env:
      NODE_ENV: "production"
EOF
        chmod 644 "$SERVERS_FILE"
        log_info "Created default servers configuration file: $SERVERS_FILE"
    fi
    
    # 創建環境變量文件
    if [ ! -f "$ENV_FILE" ]; then
        cat > "$ENV_FILE" << EOF
# MCP CLI Manager 環境變量
# 取消註釋並填入您的 API 密鑰

#ANTHROPIC_API_KEY=your_key_here
#OPENAI_API_KEY=your_key_here
#GITHUB_API_TOKEN=your_token_here
EOF
        chmod 600 "$ENV_FILE"
        log_info "Created environment variables file: $ENV_FILE"
    fi
    
    return 0
}

#######################################
# Initialize configuration
# Prompts user to overwrite existing config files
#######################################
init_config() {
    # 檢查配置文件是否存在
    local config_exists=0
    if [ -f "$CONFIG_FILE" ] || [ -f "$SERVERS_FILE" ] || [ -f "$ENV_FILE" ]; then
        config_exists=1
    fi
    
    # 如果配置文件存在，詢問是否覆蓋
    if [ $config_exists -eq 1 ]; then
        read -p "Configuration files already exist. Do you want to overwrite them? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Keeping existing configuration files."
            return 0
        fi
        
        # 備份現有配置
        local backup_dir="$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        [ -f "$CONFIG_FILE" ] && cp "$CONFIG_FILE" "$backup_dir/"
        [ -f "$SERVERS_FILE" ] && [ "$CONFIG_FILE" != "$SERVERS_FILE" ] && cp "$SERVERS_FILE" "$backup_dir/"
        [ -f "$ENV_FILE" ] && cp "$ENV_FILE" "$backup_dir/"
        
        log_info "Existing configuration backed up to: $backup_dir"
    fi
    
    # 創建新的配置文件
    create_config
    
    log_success "Configuration initialized successfully!"
    log_info "Edit the configuration files to configure your servers:"
    log_info "  $CONFIG_FILE"
    [ "$CONFIG_FILE" != "$SERVERS_FILE" ] && log_info "  $SERVERS_FILE"
    log_info "  $ENV_FILE"
    
    return 0
}

# Parse YAML configuration file
# Arguments:
#   $1 - YAML file path
#   $2 - Variable name prefix (optional)
# Returns:
#   0 if successful, 1 if file not found or parsing failed
parse_yaml() {
    local file=$1
    local prefix=${2:-}
    local current_key=""
    local current_value=""
    local in_array=0
    local array_key=""
    local array_index=0
    local indent_level=0
    local prev_indent=0
    local line
    local key
    local value
    
    # Check if file exists
    if [ ! -f "$file" ]; then
        log_error "Configuration file not found" "File: $file"
        return 1
    fi
    
    # Clear configuration array
    CONFIG_VARS=()
    
    # Read file line by line
    while IFS= read -r line; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        
        # Calculate indentation level
        indent_level=0
        while [[ "$line" =~ ^[[:space:]] ]]; do
            line="${line# }"
            ((indent_level++))
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
        
        # Handle nested objects
        if [ $indent_level -gt $prev_indent ]; then
            # Start of nested object
            if [ -n "$current_key" ]; then
                prefix="${prefix}${current_key}_"
            fi
        elif [ $indent_level -lt $prev_indent ]; then
            # End of nested object
            local diff=$((prev_indent - indent_level))
            for ((i=0; i<diff; i++)); do
                prefix="${prefix%*_}"
            done
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
        
        prev_indent=$indent_level
    done < "$file"
    
    # Save last key-value pair
    if [ -n "$current_key" ]; then
        CONFIG_VARS["${prefix}${current_key}"]="$current_value"
    fi
    
    return 0
}

# Get server configuration
# Arguments:
#   $1 - Server name
# Returns:
#   0 if configuration retrieved successfully
#   1 if configuration not found or invalid
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

# 函數名稱: list_servers
# 描述: 列出所有已配置的伺服器
# 功能:
#   - 顯示伺服器狀態
#   - 顯示伺服器描述
# 返回值:
#   0: 成功列出伺服器
#   1: 配置檔案不存在
# 輸出格式:
#   伺服器名稱: 狀態 (描述)
# 使用範例:
#   list_servers
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

#######################################
# Validate configuration file
# Arguments:
#   $1 - Configuration file path
#######################################
validate_config_file() {
    local file=$1
    local line_num=0
    local line
    local prev_indent=0
    local indent_level=0
    
    # Check if file exists
    if [ ! -f "$file" ]; then
        log_error "Configuration file not found" "File: $file"
        return 1
    fi
    
    # Read file line by line
    while IFS= read -r line; do
        ((line_num++))
        
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        
        # Calculate indentation level
        indent_level=0
        while [[ "$line" =~ ^[[:space:]] ]]; do
            line="${line# }"
            ((indent_level++))
        done
        
        # Check indentation consistency
        if [ $((indent_level - prev_indent)) -gt 1 ]; then
            log_error "Invalid indentation" \
                     "File: $file" \
                     "Line: $line_num" \
                     "Indentation should increase by 1"
            return 1
        fi
        
        # Check for invalid characters
        if [[ "$line" =~ [^\ -~] ]]; then
            log_error "Invalid characters found" \
                     "File: $file" \
                     "Line: $line_num" \
                     "Only ASCII characters are allowed"
            return 1
        fi
        
        # Check for missing space after colon
        if [[ "$line" =~ ^[^:]+:[^[:space:]] ]]; then
            log_error "Missing space after colon" \
                     "File: $file" \
                     "Line: $line_num" \
                     "Add a space after the colon"
            return 1
        fi
        
        prev_indent=$indent_level
    done < "$file"
    
    return 0
}

#######################################
# Load and validate configuration
# Arguments:
#   $1 - Configuration file path
#   $2 - Prefix for variable names (optional)
#######################################
load_config() {
    local file=$1
    local prefix=${2:-}
    
    # Validate configuration file
    validate_config_file "$file" || return 1
    
    # Parse configuration
    parse_yaml "$file" "$prefix" || return 1
    
    return 0
} 