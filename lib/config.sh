#!/bin/bash

# 導入工具函數
source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

# 配置文件路徑
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
CURSOR_CONFIG=".cursor/mcp/config.json"
DEFAULT_CONFIG="${MCP_CONFIG_PATH:-servers.conf}"

# 檢查現有配置
check_existing_configs() {
    local found=0
    
    # 檢查 Claude 配置
    if [ -f "$CLAUDE_CONFIG" ]; then
        if validate_json "$CLAUDE_CONFIG"; then
            log_success "Found Claude config: $CLAUDE_CONFIG"
            found=1
        else
            log_warn "Invalid Claude config found: $CLAUDE_CONFIG"
        fi
    fi
    
    # 檢查 Cursor 配置
    if [ -f "$CURSOR_CONFIG" ]; then
        if validate_json "$CURSOR_CONFIG"; then
            log_success "Found Cursor config: $CURSOR_CONFIG"
            found=1
        else
            log_warn "Invalid Cursor config found: $CURSOR_CONFIG"
        fi
    fi
    
    return $found
}

# 導入配置
import_config() {
    local source_file=$1
    local target_file=${2:-$DEFAULT_CONFIG}
    
    # 檢查源文件
    if [ ! -f "$source_file" ]; then
        log_error "Config file not found" \
                 "File does not exist: $source_file" \
                 "Check the file path and try again"
        return 1
    fi
    
    # 驗證 JSON 格式
    if ! validate_json "$source_file"; then
        return 1
    fi
    
    # 轉換配置格式
    if ! jq -r '.mcpServers | to_entries | map({
        name: .key,
        command: .value.command,
        args: (.value.args // []),
        description: (.value.description // "")
    })' "$source_file" > "$target_file"; then
        log_error "Failed to convert config" \
                 "Error while processing JSON" \
                 "Check if the source file has the correct structure"
        return 1
    fi
    
    log_success "Configuration imported successfully to $target_file"
    return 0
}

# 列出服務器
list_servers() {
    local config_file=${1:-$DEFAULT_CONFIG}
    
    # 檢查配置文件
    if [ ! -f "$config_file" ]; then
        log_error "No configuration file found" \
                 "File does not exist: $config_file" \
                 "Run 'mcp init' or 'mcp import' first"
        return 1
    fi
    
    # 驗證 JSON 格式
    if ! validate_json "$config_file"; then
        return 1
    fi
    
    # 顯示配置的服務器
    log_info "Configured servers:"
    jq -r '.[] | "\(.name):\n  Command: \(.command)\n  Args: \(.args | join(" "))\n  Description: \(.description)\n"' "$config_file"
    
    return 0
}

# 獲取服務器配置
get_server_config() {
    local server_name=$1
    local config_file=${2:-$DEFAULT_CONFIG}
    
    # 檢查參數
    if [ -z "$server_name" ]; then
        log_error "No server name provided" \
                 "Server name is required" \
                 "Provide a server name as argument"
        return 1
    fi
    
    # 檢查配置文件
    if [ ! -f "$config_file" ]; then
        log_error "Configuration file not found" \
                 "File does not exist: $config_file" \
                 "Run 'mcp init' or 'mcp import' first"
        return 1
    fi
    
    # 獲取服務器配置
    local server_config
    server_config=$(jq -r ".[] | select(.name == \"$server_name\")" "$config_file")
    
    if [ -z "$server_config" ]; then
        log_error "Server not found" \
                 "No configuration found for server: $server_name" \
                 "Check server name or list available servers with 'mcp list'"
        return 1
    fi
    
    echo "$server_config"
    return 0
} 