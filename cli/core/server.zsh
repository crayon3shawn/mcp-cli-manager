#!/bin/zsh

# 檢查進程是否在運行
is_server_running() {
    local pid="$1"
    kill -0 "${pid}" 2>/dev/null
}

# 獲取進程的 PID
get_server_pids() {
    local cmd="$1"
    pgrep -f "${cmd}"
}

# 停止進程
kill_server() {
    local pid="$1"
    local force="$2"
    
    if [[ "${force}" == "true" ]]; then
        kill -9 "${pid}" 2>/dev/null
    else
        kill "${pid}" 2>/dev/null
    fi
}

# 檢查服務狀態
check_server_status() {
    local server_name="$1"
    local pid_file="${RUNTIME_DIR}/${server_name}.pid"
    
    if [[ ! -f "${pid_file}" ]]; then
        echo "stopped"
        return
    fi
    
    local pids=($(cat "${pid_file}"))
    for pid in "${pids[@]}"; do
        if is_server_running "${pid}"; then
            echo "running"
            return
        fi
    done
    
    echo "stopped"
}

# 解析 JSON 文件
parse_json() {
    local file="$1"
    local query="$2"
    python3 -c "import json,sys; print(json.load(open('${file}'))${query})" 2>/dev/null
}

# 列出所有服務
list_server() {
    if [[ ! -f "${CONFIG_FILE}" ]]; then
        echo "錯誤: 配置文件不存在: ${CONFIG_FILE}" >&2
        return 1
    fi

    # 獲取所有服務名稱
    local servers=($(parse_json "${CONFIG_FILE}" "['mcpServers'].keys()"))
    
    if [[ ${#servers} -eq 0 ]]; then
        echo "沒有找到任何服務"
        return 0
    fi

    # 遍歷每個服務
    for server_name in "${servers[@]}"; do
        # 獲取服務配置
        local command=$(parse_json "${CONFIG_FILE}" "['mcpServers']['${server_name}']['command']")
        local args=($(parse_json "${CONFIG_FILE}" "['mcpServers']['${server_name}']['args']"))
        
        # 檢查服務狀態
        local server_status="stopped"
        local pid_file="${RUNTIME_DIR}/${server_name}.pid"
        if [[ -f "${pid_file}" ]]; then
            local pid=$(cat "${pid_file}")
            if is_server_running "${pid}"; then
                server_status="running"
            fi
        fi

        # 設置狀態顏色
        if [[ "${server_status}" = "running" ]]; then
            print -P "${server_name} %F{green}[${server_status}]%f ${args[*]}"
        else
            print -P "${server_name} %F{red}[${server_status}]%f ${args[*]}"
        fi
    done
}

# 啟動服務
start_server() {
    local server_name="$1"
    
    if ! parse_json "${CONFIG_FILE}" "['mcpServers']['${server_name}']" >/dev/null; then
        echo "錯誤: 服務不存在: ${server_name}" >&2
        return 1
    fi
    
    if [[ $(check_server_status "${server_name}") == "running" ]]; then
        echo "錯誤: 服務已經在運行中: ${server_name}" >&2
        return 1
    fi
    
    local cmd=$(parse_json "${CONFIG_FILE}" "['mcpServers']['${server_name}']['command']")
    local args=($(parse_json "${CONFIG_FILE}" "['mcpServers']['${server_name}']['args']"))
    local env_vars=$(parse_json "${CONFIG_FILE}" "['mcpServers']['${server_name}']['env']" | python3 -c "import json,sys; [print(f'export {k}=\"{v}\"') for k,v in json.load(sys.stdin).items()]")
    
    local pid_file="${RUNTIME_DIR}/${server_name}.pid"
    local log_file="${RUNTIME_DIR}/${server_name}.log"
    local run_script="${RUNTIME_DIR}/${server_name}_run.sh"
    
    echo "正在啟動命令: ${cmd} ${args[*]}"
    echo "PID 文件: ${pid_file}"
    echo "日誌文件: ${log_file}"
    
    # 創建啟動腳本
    cat > "${run_script}" << 'EOF'
#!/bin/zsh
cd "${HOME}"
EOF
    
    # 添加環境變數
    echo "${env_vars}" >> "${run_script}"
    
    # 添加執行命令
    cat >> "${run_script}" << EOF
# 顯示環境變數的值
echo "環境變數:" >> "${log_file}"
env | grep -E "GITHUB|MCP" >> "${log_file}"
echo "---" >> "${log_file}"

exec "${cmd}" ${args[@]} >> "${log_file}" 2>&1
EOF

    chmod +x "${run_script}"
    
    # 在後台運行啟動腳本
    screen -dmS "${server_name}" "${run_script}"
    sleep 2  # 等待進程啟動
    
    # 獲取實際的進程 ID
    local pids=($(get_server_pids "${cmd}"))
    if [[ ${#pids[@]} -gt 0 ]]; then
        printf "%s\n" "${pids[@]}" > "${pid_file}"
        echo "服務已啟動: ${server_name} (PIDs: ${pids[*]})"
        echo "日誌文件: ${log_file}"
        rm -f "${run_script}"
        return 0
    fi
    
    echo "錯誤: 服務啟動失敗" >&2
    [[ -f "${log_file}" ]] && echo "日誌內容:" && cat "${log_file}"
    echo "啟動腳本內容:" && cat "${run_script}"
    rm -f "${pid_file}" "${log_file}" "${run_script}"
    return 1
}

# 停止服務
stop_server() {
    local server_name="$1"
    local pid_file="${RUNTIME_DIR}/${server_name}.pid"
    
    if [[ ! -f "${pid_file}" ]]; then
        echo "錯誤: 服務未運行: ${server_name}" >&2
        return 1
    fi
    
    local pids=($(cat "${pid_file}"))
    local running=0
    for pid in "${pids[@]}"; do
        if is_server_running "${pid}"; then
            running=1
            break
        fi
    done
    
    if [[ ${running} -eq 0 ]]; then
        echo "錯誤: 服務已經停止: ${server_name}" >&2
        rm -f "${pid_file}"
        return 1
    fi
    
    # 嘗試正常停止
    for pid in "${pids[@]}"; do
        kill_server "${pid}" "false"
    done
    sleep 5
    
    # 檢查是否需要強制停止
    running=0
    for pid in "${pids[@]}"; do
        if is_server_running "${pid}"; then
            running=1
            kill_server "${pid}" "true"
        fi
    done
    
    rm -f "${pid_file}"
    echo "服務已停止: ${server_name}"
} 