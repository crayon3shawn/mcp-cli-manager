#!/bin/zsh

# 列出所有服務
mcp_list() {
    mcp_load_config || return 1
    
    jq -r '.mcpServers | keys[]' "${CONFIG_FILE}" | while read server; do
        local srv_status=$(mcp_check_status "${server}")
        local pid_file=$(mcp_get_pid_file "${server}")
        local pids="-"
        [[ -f "${pid_file}" ]] && pids=$(tr '\n' ' ' < "${pid_file}")
        
        echo "服務: ${server}"
        echo "  狀態: ${srv_status}"
        echo "  PIDs: ${pids}"
        echo "  命令: $(mcp_get_service_config "${server}" "command")"
        echo "  參數: $(mcp_get_service_config "${server}" "args[]" 2>/dev/null | tr '\n' ' ')"
        echo
    done
}

# 啟動服務
mcp_start() {
    local server_name="$1"
    mcp_load_config || return 1
    
    if ! jq -e ".mcpServers.${server_name}" "${CONFIG_FILE}" >/dev/null; then
        echo "錯誤: 服務不存在: ${server_name}" >&2
        return 1
    fi
    
    if [[ $(mcp_check_status "${server_name}") == "running" ]]; then
        echo "錯誤: 服務已經在運行中: ${server_name}" >&2
        return 1
    fi
    
    local cmd=$(mcp_get_service_config "${server_name}" "command")
    local args=($(mcp_get_service_config "${server_name}" "args[]" 2>/dev/null))
    local env_vars=$(jq -r ".mcpServers.${server_name}.env | to_entries | .[] | \"export \(.key)='\(.value)'\"" "${CONFIG_FILE}" 2>/dev/null | envsubst)
    
    local pid_file=$(mcp_get_pid_file "${server_name}")
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
    
    # 添加環境變數處理
    mcp_load_env >> "${run_script}"
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
    local pids=($(mcp_get_pids "${cmd}"))
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
mcp_stop() {
    local server_name="$1"
    local pid_file=$(mcp_get_pid_file "${server_name}")
    
    if [[ ! -f "${pid_file}" ]]; then
        echo "錯誤: 服務未運行: ${server_name}" >&2
        return 1
    fi
    
    local pids=($(cat "${pid_file}"))
    local running=0
    for pid in "${pids[@]}"; do
        if mcp_is_process_running "${pid}"; then
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
        mcp_kill_process "${pid}" "false"
    done
    sleep 5
    
    # 檢查是否需要強制停止
    running=0
    for pid in "${pids[@]}"; do
        if mcp_is_process_running "${pid}"; then
            running=1
            mcp_kill_process "${pid}" "true"
        fi
    done
    
    rm -f "${pid_file}"
    echo "服務已停止: ${server_name}"
} 