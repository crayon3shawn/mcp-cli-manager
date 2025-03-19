#!/bin/bash
#
# 檔案名稱: validator.sh
# 描述: 安全性驗證模組，用於驗證命令執行、檔案權限和環境安全性
# 作者: MCP CLI Manager Team
# 建立日期: 2024-03-19
# 最後更新: 2024-03-19
#
# 使用方式:
#   ./validator.sh <command> [args]
#
# 命令:
#   validate-command <command> [args] - 驗證命令是否允許執行
#   validate-file-permissions <file> [perms] - 驗證檔案權限
#   validate-env-security - 驗證環境安全性設定
#   add-allowed-command <command> [description] - 新增允許的命令
#   remove-allowed-command <command> - 移除允許的命令
#   list-allowed-commands - 列出所有允許的命令
#
# 返回值:
#   0: 驗證成功
#   1: 驗證失敗
#   2: 參數錯誤
#
# 依賴:
#   - core/env.sh: 環境變數設定
#   - core/log.sh: 日誌功能
#
# 安全注意事項:
#   - 此模組包含敏感的安全驗證邏輯
#   - 修改時需經過安全審查
#   - 確保檔案權限設定正確（建議：644）
#
# 範例:
#   ./validator.sh validate-command "node" "script.js"
#   ./validator.sh validate-file-permissions "config.yaml" 644
#   ./validator.sh validate-env-security

# Import core modules
source "$(dirname "${BASH_SOURCE[0]}")/../core/env.sh"
source "$(dirname "${BASH_SOURCE[0]}")/../core/log.sh"

# Define allowed commands and their descriptions
ALLOWED_COMMANDS=(
    "node:Node.js runtime"
    "python:Python interpreter"
    "python3:Python 3 interpreter"
    "java:Java runtime"
    "npm:Node.js package manager"
    "pip:Python package manager"
    "pip3:Python 3 package manager"
)

# Define dangerous patterns
DANGEROUS_PATTERNS=(
    "rm -rf /*"
    "rm -rf /"
    "> /dev/sda"
    "mkfs"
    ":(){:|:&};:"
    "dd if=/dev/zero"
    "dd if=/dev/random"
)

# 函數名稱: is_command_allowed
# 描述: 檢查命令是否在允許清單中
# 參數:
#   $1: 要檢查的命令
# 返回值:
#   0: 命令允許執行
#   1: 命令不允許執行
# 使用範例:
#   is_command_allowed "node"
is_command_allowed() {
    local cmd=$1
    local base_cmd
    base_cmd=$(basename "$cmd")
    
    for entry in "${ALLOWED_COMMANDS[@]}"; do
        local allowed_cmd
        allowed_cmd="${entry%%:*}"
        if [ "$base_cmd" = "$allowed_cmd" ]; then
            return 0
        fi
    done
    return 1
}

# 函數名稱: get_command_description
# 描述: 獲取命令的描述信息
# 參數:
#   $1: 命令名稱
# 返回值:
#   0: 成功獲取描述
#   1: 命令不存在
# 輸出:
#   命令的描述文字或 "Unknown command"
# 使用範例:
#   description=$(get_command_description "node")
get_command_description() {
    local cmd=$1
    local base_cmd
    base_cmd=$(basename "$cmd")
    
    for entry in "${ALLOWED_COMMANDS[@]}"; do
        local allowed_cmd
        local description
        allowed_cmd="${entry%%:*}"
        description="${entry#*:}"
        if [ "$base_cmd" = "$allowed_cmd" ]; then
            echo "$description"
            return 0
        fi
    done
    echo "Unknown command"
    return 1
}

# 函數名稱: validate_command
# 描述: 驗證命令的安全性，包括白名單檢查和危險模式檢測
# 參數:
#   $1: 要執行的命令
#   $2: 命令參數（可選）
# 返回值:
#   0: 驗證通過
#   1: 驗證失敗
# 安全檢查:
#   - 命令是否在白名單中
#   - 是否包含危險模式
#   - 命令是否存在於系統中
# 使用範例:
#   validate_command "node" "script.js"
validate_command() {
    local command=$1
    local args=$2
    
    # Check if command is empty
    if [ -z "$command" ]; then
        log_error "Invalid command" \
                 "Command is empty" \
                 "Provide a valid command"
        return 1
    fi
    
    # Get base command (without path)
    local base_command
    base_command=$(basename "$command")
    
    # Check if command is in whitelist
    if ! is_command_allowed "$command"; then
        local allowed_commands
        allowed_commands=$(printf "%s " "${ALLOWED_COMMANDS[@]%%:*}")
        log_error "Command not allowed: $base_command" \
                 "Command is not in the allowed list" \
                 "Use one of: $allowed_commands"
        return 1
    fi
    
    # Check for dangerous patterns in command and args
    local full_command="$command $args"
    for pattern in "${DANGEROUS_PATTERNS[@]}"; do
        if [[ "$full_command" == *"$pattern"* ]]; then
            log_error "Dangerous command pattern detected" \
                     "Command contains dangerous pattern: $pattern" \
                     "Review and modify the command"
            return 1
        fi
    done
    
    # Check if command exists in PATH
    if ! command -v "$command" &> /dev/null; then
        log_error "Command not found: $command" \
                 "Command is not installed or not in PATH" \
                 "Install the required command or check PATH"
        return 1
    fi
    
    return 0
}

# 函數名稱: validate_file_permissions
# 描述: 驗證檔案權限是否符合安全要求
# 參數:
#   $1: 檔案路徑
#   $2: 要求的權限（預設：644）
# 返回值:
#   0: 權限符合要求
#   1: 權限不符合要求或檔案不存在
# 使用範例:
#   validate_file_permissions "config.yaml" 644
validate_file_permissions() {
    local file=$1
    local required_perms=${2:-644}
    
    # Check if file exists
    if [ ! -f "$file" ]; then
        log_error "File not found" \
                 "File does not exist: $file" \
                 "Check the file path"
        return 1
    fi
    
    # Get file permissions in octal
    local perms
    perms=$(stat -f "%Lp" "$file")
    
    # Check if permissions are too permissive
    if [ "$perms" -gt "$required_perms" ]; then
        log_error "Invalid file permissions" \
                 "File permissions too permissive: $perms (required: $required_perms)" \
                 "Fix permissions with: chmod $required_perms $file"
        return 1
    fi
    
    return 0
}

# 函數名稱: validate_env_security
# 描述: 驗證環境安全性設定，包括目錄權限和配置檔案權限
# 參數:
#   無
# 返回值:
#   0: 所有檢查通過
#   非0: 發現的問題數量
# 檢查項目:
#   - 運行時目錄權限
#   - PID 目錄權限
#   - 配置檔案權限
# 使用範例:
#   validate_env_security
validate_env_security() {
    local issues=0
    
    # Check runtime directory permissions
    if [ -d "$MCP_RUNTIME_DIR" ]; then
        local runtime_perms
        runtime_perms=$(stat -f "%Lp" "$MCP_RUNTIME_DIR")
        if [ "$runtime_perms" -gt "755" ]; then
            log_error "Invalid runtime directory permissions" \
                     "Directory permissions too permissive: $runtime_perms" \
                     "Fix permissions with: chmod 755 $MCP_RUNTIME_DIR"
            issues=$((issues + 1))
        fi
    fi
    
    # Check PID directory permissions
    if [ -d "$MCP_PID_DIR" ]; then
        local pid_perms
        pid_perms=$(stat -f "%Lp" "$MCP_PID_DIR")
        if [ "$pid_perms" -gt "755" ]; then
            log_error "Invalid PID directory permissions" \
                     "Directory permissions too permissive: $pid_perms" \
                     "Fix permissions with: chmod 755 $MCP_PID_DIR"
            issues=$((issues + 1))
        fi
    fi
    
    # Check config file permissions
    if [ -f "$MCP_CONFIG_FILE" ]; then
        local config_perms
        config_perms=$(stat -f "%Lp" "$MCP_CONFIG_FILE")
        if [ "$config_perms" -gt "644" ]; then
            log_error "Invalid config file permissions" \
                     "File permissions too permissive: $config_perms" \
                     "Fix permissions with: chmod 644 $MCP_CONFIG_FILE"
            issues=$((issues + 1))
        fi
    fi
    
    return $issues
}

# 函數名稱: add_allowed_command
# 描述: 將新的命令添加到允許清單中
# 參數:
#   $1: 命令名稱
#   $2: 命令描述（可選，預設："Custom command"）
# 返回值:
#   0: 添加成功
#   1: 命令已存在
# 使用範例:
#   add_allowed_command "npm" "Node.js package manager"
add_allowed_command() {
    local command=$1
    local description=${2:-"Custom command"}
    
    # Check if command already exists
    if is_command_allowed "$command"; then
        log_error "Command already in whitelist" \
                 "Command $command is already allowed" \
                 "Use a different command name"
        return 1
    fi
    
    # Add command to whitelist
    ALLOWED_COMMANDS+=("$command:$description")
    log_success "Added command to whitelist: $command ($description)"
}

# 函數名稱: remove_allowed_command
# 描述: 從允許清單中移除命令
# 參數:
#   $1: 要移除的命令名稱
# 返回值:
#   0: 移除成功
#   1: 命令不存在於清單中
# 使用範例:
#   remove_allowed_command "npm"
remove_allowed_command() {
    local command=$1
    local new_commands=()
    local found=false
    
    # Remove command from whitelist
    for entry in "${ALLOWED_COMMANDS[@]}"; do
        local cmd="${entry%%:*}"
        if [ "$cmd" != "$command" ]; then
            new_commands+=("$entry")
        else
            found=true
        fi
    done
    
    if [ "$found" = true ]; then
        ALLOWED_COMMANDS=("${new_commands[@]}")
        log_success "Removed command from whitelist: $command"
    else
        log_error "Command not in whitelist" \
                 "Command not found: $command" \
                 "Check command name"
        return 1
    fi
}

# 函數名稱: list_allowed_commands
# 描述: 列出所有允許執行的命令及其描述
# 參數:
#   無
# 返回值:
#   0: 總是成功
# 輸出格式:
#   命令名稱: 描述
# 使用範例:
#   list_allowed_commands
list_allowed_commands() {
    log_info "Allowed commands:"
    for entry in "${ALLOWED_COMMANDS[@]}"; do
        local cmd="${entry%%:*}"
        local description="${entry#*:}"
        echo "  $cmd: $description"
    done
}

# Main
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-}" in
        "validate-command")
            if [ -z "${2:-}" ]; then
                log_error "No command provided" \
                         "Command is required" \
                         "Usage: $0 validate-command <command> [args]"
                exit 1
            fi
            validate_command "$2" "${3:-}"
            ;;
        "validate-file")
            if [ -z "${2:-}" ]; then
                log_error "No file provided" \
                         "File path is required" \
                         "Usage: $0 validate-file <file> [perms]"
                exit 1
            fi
            validate_file_permissions "$2" "${3:-}"
            ;;
        "validate-env")
            validate_env_security
            ;;
        "add-command")
            if [ -z "${2:-}" ]; then
                log_error "No command provided" \
                         "Command is required" \
                         "Usage: $0 add-command <command> [description]"
                exit 1
            fi
            add_allowed_command "$2" "${3:-}"
            ;;
        "remove-command")
            if [ -z "${2:-}" ]; then
                log_error "No command provided" \
                         "Command is required" \
                         "Usage: $0 remove-command <command>"
                exit 1
            fi
            remove_allowed_command "$2"
            ;;
        "list-commands")
            list_allowed_commands
            ;;
        *)
            echo "Usage: ${0} {validate-command|validate-file|validate-env|add-command|remove-command|list-commands} [args...]" >&2
            exit 1
            ;;
    esac
fi 