#!/bin/bash

# Import required modules
source "${MCP_ROOT}/lib/core/env.sh"
source "${MCP_ROOT}/lib/core/log.sh"
source "${MCP_ROOT}/lib/config/loader.sh"

# NVM environment setup
setup_nvm_env() {
    local node_version=$1
    
    # Load NVM
    [ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh"
    
    if ! command -v nvm &> /dev/null; then
        log_error "NVM is not installed. Please install NVM first."
        return 1
    }
    
    # Use specified Node version or default to LTS
    if [ -z "$node_version" ]; then
        node_version=$(nvm version-remote --lts)
    fi
    
    # Create or use the virtual environment
    if ! nvm use "$node_version" &> /dev/null; then
        log_info "Installing Node.js version $node_version"
        nvm install "$node_version" || {
            log_error "Failed to install Node.js version $node_version"
            return 1
        }
    fi
    
    log_info "Using Node.js $(node --version) from NVM"
    return 0
}

# 查找進程 ID
find_process() {
    local server_name=$1
    local method=$(get_config ".process.findMethod")
    local pattern=$(get_config ".process.namePattern" | sed "s/%s/$server_name/")
    
    case "$method" in
        "pgrep")
            pgrep -f "$pattern" 2>/dev/null
            ;;
        "ps")
            ps aux | grep "$pattern" | grep -v grep | awk '{print $2}'
            ;;
        *)
            log_error "未知的進程查找方式: $method"
            return 1
            ;;
    esac
}

# 檢查進程是否運行中
is_process_running() {
    local pid=$1
    [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

# 停止進程
stop_process() {
    local pid=$1
    local signals=($(get_config ".process.stopSignals[]"))
    local timeout=$(get_config ".process.signalTimeout")
    
    for signal in "${signals[@]}"; do
        log_info "正在發送 $signal 信號到進程 $pid"
        kill -"$signal" "$pid" 2>/dev/null
        
        # 等待進程結束
        local count=0
        while [ $count -lt $timeout ] && is_process_running "$pid"; do
            sleep 1
            count=$((count + 1))
        done
        
        # 如果進程已經結束，返回成功
        if ! is_process_running "$pid"; then
            return 0
        fi
    done
    
    # 如果所有信號都發送完還沒結束，返回失敗
    return 1
}

# 啟動服務器
start_server() {
    local server_name=$1
    local config
    
    # 檢查服務器是否已經運行
    local pid=$(find_process "$server_name")
    if [ -n "$pid" ]; then
        log_warn "服務器 $server_name 已經在運行中（PID: $pid）"
        return 0
    }
    
    # 獲取服務器配置
    config=$(get_server_config "$server_name") || {
        log_error "無法獲取服務器配置：$server_name"
        return 1
    }
    
    # 設置 NVM 環境
    setup_nvm_env || return 1
    
    # 獲取配置值
    local command=$(echo "$config" | yq -r '.command')
    local args=$(echo "$config" | yq -r '.args[]' | tr '\n' ' ')
    local work_dir=$(echo "$config" | yq -r '.workDir')
    local base_dir=$(get_config ".global.workDirBase")
    
    # 展開工作目錄路徑
    work_dir="${base_dir}/${work_dir}"
    work_dir="${work_dir/#\~/$HOME}"
    
    # 創建工作目錄
    mkdir -p "$work_dir" || {
        log_error "無法創建工作目錄：$work_dir"
        return 1
    }
    
    # 切換到工作目錄
    cd "$work_dir" || {
        log_error "無法切換到工作目錄：$work_dir"
        return 1
    }
    
    # 啟動服務器
    log_info "正在啟動服務器 $server_name"
    nohup "$command" $args > "${MCP_LOG_DIR}/${server_name}.log" 2>&1 &
    local new_pid=$!
    
    # 檢查服務器是否成功啟動
    sleep 1
    if is_process_running "$new_pid"; then
        log_success "服務器 $server_name 已啟動（PID: $new_pid）"
        return 0
    else
        log_error "服務器 $server_name 啟動失敗"
        return 1
    fi
}

# 停止服務器
stop_server() {
    local server_name=$1
    local force=$2
    
    # 查找服務器進程
    local pid=$(find_process "$server_name")
    if [ -z "$pid" ]; then
        log_warn "服務器 $server_name 未運行"
        return 0
    }
    
    # 停止進程
    if [ "$force" = "true" ]; then
        log_warn "強制停止服務器 $server_name（PID: $pid）"
        kill -9 "$pid" 2>/dev/null
    else
        log_info "正在停止服務器 $server_name（PID: $pid）"
        if ! stop_process "$pid"; then
            log_error "無法正常停止服務器 $server_name，嘗試強制停止"
            kill -9 "$pid" 2>/dev/null
        fi
    fi
    
    # 檢查是否成功停止
    if ! is_process_running "$pid"; then
        log_success "服務器 $server_name 已停止"
        return 0
    else
        log_error "無法停止服務器 $server_name"
        return 1
    fi
}

# 獲取服務器狀態
get_server_status() {
    local server_name=$1
    local pid=$(find_process "$server_name")
    
    if [ -n "$pid" ] && is_process_running "$pid"; then
        echo "running"
    else
        echo "stopped"
    fi
}

# Restart server
restart_server() {
    local server_name=$1
    
    if is_server_running "$server_name"; then
        if ! stop_server "$server_name"; then
            return 1
        fi
    fi
    
    start_server "$server_name"
} 