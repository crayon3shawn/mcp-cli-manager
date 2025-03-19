#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Output prefixes
OK_PREFIX="${GREEN}[OK]${NC}"
ERROR_PREFIX="${RED}[ERROR]${NC}"
WARN_PREFIX="${YELLOW}[WARN]${NC}"
INFO_PREFIX="[INFO]"

# 日誌函數
log_info() {
    echo -e "${INFO_PREFIX} $1"
}

log_success() {
    echo -e "${OK_PREFIX} $1"
}

log_error() {
    echo -e "${ERROR_PREFIX} $1"
    [ ! -z "$2" ] && echo "Reason: $2"
    [ ! -z "$3" ] && echo "Solution: $3"
}

log_warn() {
    echo -e "${WARN_PREFIX} $1"
}

# 環境檢查
check_dependencies() {
    # 檢查 jq
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed" \
                 "Command 'jq' not found" \
                 "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
        return 1
    fi

    # 檢查 nvm
    if ! command -v nvm &> /dev/null; then
        log_error "nvm is required but not installed" \
                 "Node Version Manager not found" \
                 "Install from: https://github.com/nvm-sh/nvm#installing-and-updating"
        return 1
    fi

    return 0
}

# 加載 .env 文件
load_env() {
    if [ -f ".env" ]; then
        log_info "Loading environment variables from .env"
        set -a
        source .env
        set +a
    else
        log_warn "No .env file found"
    fi
}

# 檢查必要的環境變量
check_env_vars() {
    local missing=0
    local required_vars=("MCP_CONFIG_PATH" "MCP_LOG_LEVEL")

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Missing required environment variable: $var"
            missing=1
        fi
    done

    return $missing
}

# 驗證 JSON 格式
validate_json() {
    local file=$1
    if ! jq empty "$file" 2>/dev/null; then
        log_error "Invalid JSON format in $file" \
                 "File contains invalid JSON syntax" \
                 "Check the file content and fix JSON syntax errors"
        return 1
    fi
    return 0
} 