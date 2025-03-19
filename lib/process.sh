#!/bin/bash

# 導入依賴
source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"
source "$(dirname "${BASH_SOURCE[0]}")/config.sh"

# 啟動服務器
start_server() {
    local server_name=$1
    
    # 獲取服務器配置
    local server_config
    if ! server_config=$(get_server_config "$server_name"); then
        return 1
    fi
    
    # 檢查服務器是否已在運行
    if is_server_running "$server_name"; then
        log_warn "Server '$server_name' is already running"
        return 0
    fi
    
    # 提取命令和參數
    local command
    local args
    command=$(echo "$server_config" | jq -r '.command')
    args=$(echo "$server_config" | jq -r '.args | join(" ")')
    
    # 創建日誌目錄
    local log_dir="/tmp/mcp/logs"
    mkdir -p "$log_dir"
    
    # 啟動服務器
    nohup $command $args > "$log_dir/$server_name.log" 2>&1 &
    local pid=$!
    
    # 檢查是否成功啟動
    if ps -p $pid > /dev/null; then
        log_success "Started server '$server_name' (PID: $pid)"
        # 保存 PID
        echo $pid > "$log_dir/$server_name.pid"
        return 0
    else
        log_error "Failed to start server '$server_name'" \
                 "Process died immediately" \
                 "Check logs at $log_dir/$server_name.log"
        return 1
    fi
}

# 停止服務器
stop_server() {
    local server_name=$1
    local pid_file="/tmp/mcp/logs/$server_name.pid"
    
    # 檢查 PID 文件
    if [ ! -f "$pid_file" ]; then
        log_error "Server '$server_name' is not running" \
                 "PID file not found" \
                 "Start the server first with 'mcp start $server_name'"
        return 1
    fi
    
    # 讀取 PID
    local pid
    pid=$(cat "$pid_file")
    
    # 檢查進程是否存在
    if ! ps -p $pid > /dev/null; then
        log_warn "Server '$server_name' is not running (stale PID file)"
        rm -f "$pid_file"
        return 0
    fi
    
    # 嘗試優雅停止
    kill -TERM $pid
    
    # 等待進程結束
    local count=0
    while ps -p $pid > /dev/null && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done
    
    # 如果進程還在運行，強制結束
    if ps -p $pid > /dev/null; then
        log_warn "Server '$server_name' not responding to SIGTERM, using SIGKILL"
        kill -9 $pid
    fi
    
    # 刪除 PID 文件
    rm -f "$pid_file"
    log_success "Stopped server '$server_name'"
    return 0
}

# 檢查服務器狀態
is_server_running() {
    local server_name=$1
    local pid_file="/tmp/mcp/logs/$server_name.pid"
    
    # 檢查 PID 文件
    if [ ! -f "$pid_file" ]; then
        return 1
    fi
    
    # 讀取 PID
    local pid
    pid=$(cat "$pid_file")
    
    # 檢查進程是否存在
    if ps -p $pid > /dev/null; then
        return 0
    else
        # 清理過期的 PID 文件
        rm -f "$pid_file"
        return 1
    fi
}

# 獲取服務器狀態
get_server_status() {
    local server_name=$1
    
    if is_server_running "$server_name"; then
        local pid
        pid=$(cat "/tmp/mcp/logs/$server_name.pid")
        echo "running (PID: $pid)"
    else
        echo "stopped"
    fi
}

# 重啟服務器
restart_server() {
    local server_name=$1
    
    if is_server_running "$server_name"; then
        if ! stop_server "$server_name"; then
            return 1
        fi
    fi
    
    start_server "$server_name"
} 