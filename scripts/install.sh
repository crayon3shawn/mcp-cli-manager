#!/usr/bin/env bash

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 錯誤處理
set -e
trap 'echo -e "${RED}錯誤：安裝過程中斷${NC}" >&2' ERR

# 打印信息
info() {
    echo -e "${GREEN}$1${NC}"
}

warn() {
    echo -e "${YELLOW}警告：$1${NC}"
}

error() {
    echo -e "${RED}錯誤：$1${NC}" >&2
    exit 1
}

# 檢查命令是否存在
check_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        error "$1 未安裝。請先安裝 $1"
    fi
}

# 檢查 Node.js 版本
check_node_version() {
    local required_version="18.0.0"
    local current_version=$(node -v | cut -d'v' -f2)
    
    if ! command -v node >/dev/null 2>&1; then
        error "Node.js 未安裝"
    fi
    
    if [ "$(printf '%s\n' "$required_version" "$current_version" | sort -V | head -n1)" != "$required_version" ]; then
        error "Node.js 版本過低。需要 v$required_version 或更高版本"
    fi
}

# 檢查 npm 版本
check_npm_version() {
    local required_version="8.0.0"
    local current_version=$(npm -v)
    
    if ! command -v npm >/dev/null 2>&1; then
        error "npm 未安裝"
    fi
    
    if [ "$(printf '%s\n' "$required_version" "$current_version" | sort -V | head -n1)" != "$required_version" ]; then
        error "npm 版本過低。需要 v$required_version 或更高版本"
    fi
}

# 檢查 nvm
check_nvm() {
    if ! command -v nvm >/dev/null 2>&1; then
        warn "nvm 未安裝。建議安裝 nvm 以更好地管理 Node.js 版本"
        warn "可以從 https://github.com/nvm-sh/nvm 安裝"
    fi
}

# 檢查並創建目錄
setup_directories() {
    # 檢查操作系統
    case "$(uname)" in
        "Darwin")
            CONFIG_DIR="$HOME/Library/Application Support/mcp-cli-manager"
            CACHE_DIR="$HOME/Library/Caches/mcp-cli-manager"
            ;;
        *)
            CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/mcp-cli-manager"
            CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/mcp-cli-manager"
            ;;
    esac

    mkdir -p "$CONFIG_DIR"
    mkdir -p "$CACHE_DIR"
    chmod 700 "$CONFIG_DIR" "$CACHE_DIR"
}

# 主安裝流程
main() {
    info "開始安裝 MCP CLI Manager..."
    
    # 檢查系統要求
    info "檢查系統要求..."
    check_command "git"
    check_command "curl"
    check_node_version
    check_npm_version
    check_nvm
    
    # 創建必要目錄
    info "設置目錄結構..."
    setup_directories
    
    # 克隆倉庫
    info "下載源碼..."
    TEMP_DIR=$(mktemp -d)
    git clone https://github.com/yourusername/mcp-cli-manager.git "$TEMP_DIR"
    
    # 安裝依賴
    info "安裝依賴..."
    cd "$TEMP_DIR"
    npm install --production
    
    # 安裝可執行文件
    info "安裝可執行文件..."
    sudo cp bin/mcp /usr/local/bin/
    chmod +x /usr/local/bin/mcp
    
    # 複製配置文件
    info "設置配置文件..."
    if [ ! -f "$CONFIG_DIR/config.yaml" ]; then
        cp config.yaml.example "$CONFIG_DIR/config.yaml"
    fi
    if [ ! -f "$CONFIG_DIR/servers.yaml" ]; then
        cp servers.yaml.example "$CONFIG_DIR/servers.yaml"
    fi
    
    # 清理
    info "清理臨時文件..."
    cd - > /dev/null
    rm -rf "$TEMP_DIR"
    
    info "安裝完成！"
    info "使用 'mcp init' 初始化配置"
}

main 