#!/bin/zsh

# 獲取 PID 文件路徑
mcp_get_pid_file() {
    echo "${RUNTIME_DIR}/$1.pid"
}

# 檢查進程是否運行
mcp_is_process_running() {
    local pid="$1"
    kill -0 "${pid}" 2>/dev/null
    return $?
}

# 獲取進程列表
mcp_get_pids() {
    local cmd="$1"
    pgrep -f "${cmd}"
}

# 停止進程
mcp_kill_process() {
    local pid="$1"
    local force="$2"
    
    if [[ "${force}" == "true" ]]; then
        kill -9 "${pid}" 2>/dev/null
    else
        kill "${pid}" 2>/dev/null
    fi
}

# 檢查服務狀態
mcp_check_status() {
    local server_name="$1"
    local pid_file=$(mcp_get_pid_file "${server_name}")
    
    if [[ -f "${pid_file}" ]]; then
        local pids=($(cat "${pid_file}"))
        local running=0
        for pid in "${pids[@]}"; do
            if mcp_is_process_running "${pid}"; then
                running=1
                break
            fi
        done
        if [[ ${running} -eq 1 ]]; then
            echo "running"
            return 0
        fi
    fi
    echo "stopped"
    return 1
} 