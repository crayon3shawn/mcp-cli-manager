#!/bin/bash

# 設置錯誤處理
set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 打印信息函數
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        return 1
    fi
    return 0
}

# 檢查並安裝依賴
check_and_install_dependencies() {
    local missing_deps=()
    
    # 檢查必要的命令
    local required_commands=("git" "curl" "node" "npm")
    for cmd in "${required_commands[@]}"; do
        if ! check_command "$cmd"; then
            missing_deps+=("$cmd")
        fi
    done
    
    # 如果有缺少的依賴，詢問用戶是否安裝
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_warning "Missing required dependencies: ${missing_deps[*]}"
        read -p "Do you want to install them? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Cannot proceed without required dependencies"
            exit 1
        fi
        
        # 檢測包管理器
        if check_command "brew"; then
            print_info "Installing dependencies using Homebrew..."
            for dep in "${missing_deps[@]}"; do
                brew install "$dep"
            done
        elif check_command "apt-get"; then
            print_info "Installing dependencies using apt-get..."
            sudo apt-get update
            sudo apt-get install -y "${missing_deps[@]}"
        else
            print_error "No supported package manager found"
            print_error "Please install the following dependencies manually: ${missing_deps[*]}"
            exit 1
        fi
    fi
}

# 檢查 Node.js 版本
check_node_version() {
    local required_version="18.0.0"
    local current_version
    current_version=$(node -v | cut -d'v' -f2)
    
    if [ "$(printf '%s\n' "$required_version" "$current_version" | sort -V | head -n1)" != "$required_version" ]; then
        print_error "Node.js version $required_version or higher is required"
        exit 1
    fi
}

# 檢查 npm 版本
check_npm_version() {
    local required_version="8.0.0"
    local current_version
    current_version=$(npm -v)
    
    if [ "$(printf '%s\n' "$required_version" "$current_version" | sort -V | head -n1)" != "$required_version" ]; then
        print_error "npm version $required_version or higher is required"
        exit 1
    fi
}

# 創建配置文件
create_config() {
    local config_dir="$1"
    local server_name="$2"
    local server_command="$3"
    local server_dir="$4"
    
    # 創建配置目錄
    mkdir -p "$config_dir"
    
    # 創建 servers.yaml
    cat > "$config_dir/servers.yaml" << EOF
# MCP CLI Manager 服務器配置
# 要啟用服務器，請移除 enabled: false 的註釋

servers:
  $server_name:
    #enabled: false  # 取消註釋以啟用服務器
    name: "$server_name"
    description: "自動創建的服務器配置"
    command: "$server_command"
    working_dir: "$server_dir"
    env:
      NODE_ENV: "production"
    #ports:
    #  - 3000
    #health_check:
    #  url: "http://localhost:3000/health"
    #  interval: "5s"
    #  timeout: "3s"
    #  retries: 3
EOF
    
    # 創建 config.yaml
    cat > "$config_dir/config.yaml" << EOF
# MCP CLI Manager 全局配置
# 取消註釋以啟用相應功能

logging:
  #level: info
  #format: text
  #file: mcp.log
  #max_size: 10MB
  #max_files: 5

process:
  find_method: pgrep
  name_pattern: "%s"
  #start_timeout: 30s
  #stop_timeout: 30s
  #health_check_interval: 5s
  #stop_signals:
  #  - signal: SIGTERM
  #    wait: 5s
  #  - signal: SIGKILL
  #    wait: 0s
EOF
    
    # 創建 .env
    cat > "$config_dir/.env" << EOF
# MCP CLI Manager 環境變量
# 取消註釋並填入您的 API 密鑰

#ANTHROPIC_API_KEY=your_key_here
#OPENAI_API_KEY=your_key_here
#GITHUB_API_TOKEN=your_token_here
EOF
}

# 互動式配置
interactive_setup() {
    print_info "Starting interactive setup..."
    
    # 詢問服務器配置
    read -p "Enter server name (default: my-server): " server_name
    server_name=${server_name:-my-server}
    
    read -p "Enter server command (default: node server.js): " server_command
    server_command=${server_command:-"node server.js"}
    
    read -p "Enter working directory (default: .): " server_dir
    server_dir=${server_dir:-.}
    
    # 創建配置
    create_config "${HOME}/.config/mcp-cli-manager" "$server_name" "$server_command" "$server_dir"
    
    print_info "Configuration files created successfully!"
    print_info "Edit the configuration files to enable features and servers:"
    print_info "  ${HOME}/.config/mcp-cli-manager/servers.yaml"
    print_info "  ${HOME}/.config/mcp-cli-manager/config.yaml"
    print_info "  ${HOME}/.config/mcp-cli-manager/.env"
}

# 主安裝流程
main() {
    print_info "Starting installation..."
    
    # 檢查並安裝依賴
    check_and_install_dependencies
    
    # 檢查版本要求
    check_node_version
    check_npm_version
    
    # 詢問是否進行互動式設置
    read -p "Do you want to create initial configuration? [Y/n] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        interactive_setup
    else
        print_info "Skipping configuration setup"
        print_info "You can run 'mcp init' later to create configuration files"
    fi
    
    print_info "Installation completed successfully!"
}

# 執行主函數
main 