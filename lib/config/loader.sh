#!/bin/bash
#
# 檔案名稱: loader.sh
# 描述: MCP CLI Manager 的配置載入模組
#      負責配置檔案的載入、解析和驗證
# 作者: MCP CLI Manager Team
# 建立日期: 2024-03-19
# 最後更新: 2024-03-19
#
# 使用方式:
#   source ./loader.sh
#
# 環境要求:
#   - bash >= 4.0
#
# 依賴:
#   - ../core/env.sh: 環境變數設定
#   - ../core/log.sh: 日誌功能
#
# 配置檔案:
#   - config.yaml: 主要配置檔案
#   - servers.yaml: 伺服器配置檔案
#   - .env: 環境變數配置
#
# 目錄結構:
#   - $XDG_CONFIG_HOME/mcp-cli-manager/: 配置目錄
#   - $XDG_DATA_HOME/mcp-cli-manager/: 資料目錄
#   - $XDG_CACHE_HOME/mcp-cli-manager/: 快取目錄

set -euo pipefail
IFS=$'\n\t'

# Import core modules
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
SERVERS_FILE="$CONFIG_DIR/servers.yaml"
ENV_FILE="$CONFIG_DIR/.env"
BACKUP_DIR="$DATA_DIR/backups"

# Array to store parsed configuration
declare -A CONFIG_VARS

# 函數名稱: init_config_dirs
# 描述: 初始化配置目錄結構
# 功能:
#   - 創建必要的目錄
#   - 設置適當的權限
# 目錄:
#   - 配置目錄 (CONFIG_DIR)
#   - 資料目錄 (DATA_DIR)
#   - 快取目錄 (CACHE_DIR)
#   - 備份目錄 (BACKUP_DIR)
# 返回值:
#   0: 初始化成功
# 權限設定:
#   - 目錄權限: 700 (只有擁有者可存取)
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
    // ... existing code ...
}

#######################################
# Initialize configuration
# Prompts user to overwrite existing config files
#######################################
init_config() {
    // ... existing code ...
}

# 函數名稱: parse_yaml
# 描述: 解析 YAML 格式的配置檔案
# 參數:
#   $1: YAML 檔案路徑
#   $2: 變數名稱前綴（可選）
# 返回值:
#   0: 解析成功
#   1: 檔案不存在或解析失敗
# 功能:
#   - 支援巢狀結構
#   - 支援陣列
#   - 自動移除引號
# 使用範例:
#   parse_yaml "config.yaml" "config_"
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

# 函數名稱: get_server_config
# 描述: 獲取指定伺服器的配置信息
# 參數:
#   $1: 伺服器名稱
# 返回值:
#   0: 成功獲取配置
#   1: 配置不存在或無效
# 檢查項目:
#   - 配置檔案是否存在
#   - 伺服器配置是否存在
#   - 伺服器是否啟用
# 輸出格式:
#   key=value（每行一個配置項）
# 使用範例:
#   get_server_config "server-name"
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