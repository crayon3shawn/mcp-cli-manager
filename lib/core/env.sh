#!/bin/bash
#
# MCP 環境變量管理模塊
# 負責設置和管理 MCP CLI Manager 的環境變量、目錄結構和配置。
#
# 依賴:
#   - bash >= 4.0
#   - mkdir
#   - rm
#   - env
#
# 用法:
#   source ./env.sh
#   或
#   ./env.sh {init|validate|info|clean|export}

set -euo pipefail
IFS=$'\n\t'

# 獲取腳本目錄
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# 基礎目錄配置
if [ -n "${MCP_TEST:-}" ]; then
    # 測試環境
    export MCP_CONFIG_DIR="${MCP_CONFIG_DIR:-$PROJECT_ROOT/test/fixtures}"
    export MCP_LOG_DIR="${MCP_LOG_DIR:-$PROJECT_ROOT/test/logs}"
    export MCP_RUNTIME_DIR="${MCP_RUNTIME_DIR:-$PROJECT_ROOT/test/run}"
    export MCP_ENV="test"
else
    # 生產環境
    export MCP_HOME="${MCP_HOME:-$HOME/.mcp}"
    export MCP_CONFIG_DIR="${MCP_CONFIG_DIR:-$MCP_HOME/config}"
    export MCP_LOG_DIR="${MCP_LOG_DIR:-$MCP_HOME/logs}"
    export MCP_RUNTIME_DIR="${MCP_RUNTIME_DIR:-$MCP_HOME/run}"
    export MCP_BACKUP_DIR="${MCP_BACKUP_DIR:-$MCP_HOME/backups}"
    export MCP_ENV="${MCP_ENV:-production}"
fi

# 應用配置
export MCP_LOG_LEVEL="${MCP_LOG_LEVEL:-1}"
export MCP_LOG_MAX_SIZE="${MCP_LOG_MAX_SIZE:-10M}"
export MCP_LOG_KEEP_DAYS="${MCP_LOG_KEEP_DAYS:-7}"

# 運行時配置
export MCP_PID_DIR="${MCP_PID_DIR:-$MCP_RUNTIME_DIR/pid}"
export MCP_SOCKET_DIR="${MCP_SOCKET_DIR:-$MCP_RUNTIME_DIR/sockets}"

#######################################
# 驗證必要的環境變量是否已設置
# Globals:
#   MCP_CONFIG_DIR
#   MCP_LOG_DIR
#   MCP_RUNTIME_DIR
#   MCP_ENV
# Arguments:
#   None
# Returns:
#   0 如果所有必要變量都已設置
#   1 如果有任何變量未設置
#######################################
validate_env() {
    local required_vars=(
        "MCP_CONFIG_DIR"
        "MCP_LOG_DIR"
        "MCP_RUNTIME_DIR"
        "MCP_ENV"
    )

    local missing=0
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            echo "錯誤：缺少必要的環境變量：$var" >&2
            missing=1
        fi
    done

    return $missing
}

#######################################
# 初始化環境，創建必要的目錄結構
# Globals:
#   MCP_CONFIG_DIR
#   MCP_LOG_DIR
#   MCP_RUNTIME_DIR
#   MCP_ENV
#   MCP_HOME
#   MCP_BACKUP_DIR
#   MCP_PID_DIR
#   MCP_SOCKET_DIR
# Arguments:
#   None
# Returns:
#   None
#######################################
init_env() {
    local dirs=(
        "$MCP_CONFIG_DIR"
        "$MCP_LOG_DIR"
        "$MCP_RUNTIME_DIR"
    )

    # 添加生產環境特有的目錄
    if [ "$MCP_ENV" != "test" ]; then
        dirs+=(
            "$MCP_HOME"
            "$MCP_BACKUP_DIR"
            "$MCP_PID_DIR"
            "$MCP_SOCKET_DIR"
        )
    fi

    # 創建必要的目錄
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            echo "已創建目錄：$dir"
        fi
    done

    # 加載環境特定配置
    local env_file="$MCP_CONFIG_DIR/.env.$MCP_ENV"
    if [ -f "$env_file" ]; then
        echo "加載環境配置：$env_file"
        # shellcheck source=/dev/null
        source "$env_file"
    fi

    # 驗證環境
    validate_env
}

#######################################
# 獲取環境信息
# Globals:
#   MCP_ENV
#   MCP_CONFIG_DIR
#   MCP_LOG_DIR
#   MCP_RUNTIME_DIR
#   MCP_LOG_LEVEL
#   MCP_HOME
#   MCP_BACKUP_DIR
# Arguments:
#   None
# Returns:
#   None
# Output:
#   將環境信息打印到標準輸出
#######################################
get_env_info() {
    cat << EOF
MCP 環境信息：
==========================
環境：$MCP_ENV
配置目錄：$MCP_CONFIG_DIR
日誌目錄：$MCP_LOG_DIR
運行時目錄：$MCP_RUNTIME_DIR
日誌級別：$MCP_LOG_LEVEL
EOF

    if [ "$MCP_ENV" != "test" ]; then
        cat << EOF
主目錄：$MCP_HOME
備份目錄：$MCP_BACKUP_DIR
EOF
    fi
}

#######################################
# 清理環境（用於測試）
# Globals:
#   MCP_RUNTIME_DIR
#   MCP_LOG_DIR
# Arguments:
#   None
# Returns:
#   None
#######################################
clean_env() {
    local dirs=(
        "$MCP_RUNTIME_DIR"
        "$MCP_LOG_DIR"
    )

    for dir in "${dirs[@]}"; do
        if [ -d "$dir" ]; then
            rm -rf "$dir"
            echo "已清理目錄：$dir"
        fi
    done
}

#######################################
# 導出環境變量到文件
# Globals:
#   MCP_CONFIG_DIR
# Arguments:
#   $1 - 輸出文件路徑（可選）
# Returns:
#   None
#######################################
export_env() {
    local output_file=${1:-"$MCP_CONFIG_DIR/.env"}
    
    # 如果目錄不存在則創建
    mkdir -p "$(dirname "$output_file")"
    
    # 導出所有 MCP_ 開頭的變量
    env | grep '^MCP_' > "$output_file"
    echo "已導出環境變量到：$output_file"
}

# 主程序
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-}" in
        "init")
            init_env
            ;;
        "validate")
            validate_env
            ;;
        "info")
            get_env_info
            ;;
        "clean")
            clean_env
            ;;
        "export")
            export_env "${2:-}"
            ;;
        *)
            echo "用法：${0} {init|validate|info|clean|export}" >&2
            exit 1
            ;;
    esac
fi 