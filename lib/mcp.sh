#!/bin/zsh

# 基本設置
CONFIG_FILE="${HOME}/.cursor/mcp.json"
RUNTIME_DIR="${HOME}/.cursor/run"

# 確保運行時目錄存在
mkdir -p "${RUNTIME_DIR}"

# 讀取配置文件
load_config() {
    if [[ ! -f "${CONFIG_FILE}" ]]; then
        echo "錯誤: 配置文件不存在: ${CONFIG_FILE}" >&2
        return 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        echo "錯誤: 請安裝 jq: brew install jq" >&2
        return 1
    fi
    return 0
}

# 獲取 PID 文件路徑
get_pid_file() {
    echo "${RUNTIME_DIR}/$1.pid"
}

# 檢查服務狀態
check_status() {
    pid_file=$(get_pid_file "$1")
    if [[ -f "${pid_file}" ]]; then
        pids=($(cat "${pid_file}"))
        running=0
        for pid in "${pids[@]}"; do
            if kill -0 "${pid}" 2>/dev/null; then
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

# 列出所有服務
list() {
    load_config || return 1
    
    jq -r '.mcpServers | keys[]' "${CONFIG_FILE}" | while read server; do
        srv_status=$(check_status "${server}")
        pid_file=$(get_pid_file "${server}")
        pids="-"
        [[ -f "${pid_file}" ]] && pids=$(tr '\n' ' ' < "${pid_file}")
        
        echo "服務: ${server}"
        echo "  狀態: ${srv_status}"
        echo "  PIDs: ${pids}"
        echo "  命令: $(jq -r ".mcpServers.${server}.command" "${CONFIG_FILE}")"
        echo "  參數: $(jq -r ".mcpServers.${server}.args[]" "${CONFIG_FILE}" 2>/dev/null | tr '\n' ' ')"
        echo
    done
}

# 啟動服務
start() {
    server_name="$1"
    load_config || return 1
    
    if ! jq -e ".mcpServers.${server_name}" "${CONFIG_FILE}" >/dev/null; then
        echo "錯誤: 服務不存在: ${server_name}" >&2
        return 1
    fi
    
    if [[ $(check_status "${server_name}") == "running" ]]; then
        echo "錯誤: 服務已經在運行中: ${server_name}" >&2
        return 1
    fi
    
    cmd=$(jq -r ".mcpServers.${server_name}.command" "${CONFIG_FILE}")
    args=($(jq -r ".mcpServers.${server_name}.args[]" "${CONFIG_FILE}" 2>/dev/null))
    
    # 處理環境變數
    env_vars=$(jq -r ".mcpServers.${server_name}.env | to_entries | .[] | \"export \(.key)='\(.value)'\"" "${CONFIG_FILE}" 2>/dev/null | envsubst)
    
    # 啟動進程
    pid_file=$(get_pid_file "${server_name}")
    log_file="${RUNTIME_DIR}/${server_name}.log"
    
    echo "正在啟動命令: ${cmd} ${args[*]}"
    echo "PID 文件: ${pid_file}"
    echo "日誌文件: ${log_file}"
    
    # 創建啟動腳本
    run_script="${RUNTIME_DIR}/${server_name}_run.sh"
    cat > "${run_script}" << 'EOF'
#!/bin/zsh
cd "${HOME}"

# 讀取 .env 文件
if [[ -f "${HOME}/.env" ]]; then
    # 讀取並導出環境變數，忽略註釋和空行
    while IFS='=' read -r key value; do
        # 跳過空行和註釋
        [[ -z "${key}" || "${key}" == \#* ]] && continue
        # 移除可能的引號
        value=$(echo "${value}" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        # 導出環境變數
        export "${key}=${value}"
    done < "${HOME}/.env"
fi

# 設置服務特定的環境變數
EOF

    # 添加服務特定的環境變數
    echo "${env_vars}" >> "${run_script}"
    
    # 添加執行命令
    cat >> "${run_script}" << EOF
# 顯示環境變數的值
echo "環境變數:" >> "${log_file}"
env | grep GITHUB >> "${log_file}"
echo "---" >> "${log_file}"

exec "${cmd}" ${args[@]} >> "${log_file}" 2>&1
EOF

    chmod +x "${run_script}"
    
    # 在後台運行啟動腳本
    screen -dmS "${server_name}" "${run_script}"
    sleep 2  # 多等待一下，確保進程有足夠時間啟動
    
    # 獲取實際的進程 ID
    pids=($(pgrep -f "${cmd}"))
    if [[ ${#pids[@]} -gt 0 ]]; then
        printf "%s\n" "${pids[@]}" > "${pid_file}"
        echo "服務已啟動: ${server_name} (PIDs: ${pids[*]})"
        echo "日誌文件: ${log_file}"
        rm -f "${run_script}"  # 清理啟動腳本
        return 0
    fi
    
    echo "錯誤: 服務啟動失敗" >&2
    [[ -f "${log_file}" ]] && echo "日誌內容:" && cat "${log_file}"
    echo "啟動腳本內容:" && cat "${run_script}"
    rm -f "${pid_file}" "${log_file}" "${run_script}"
    return 1
}

# 停止服務
stop() {
    server_name="$1"
    pid_file=$(get_pid_file "${server_name}")
    
    if [[ ! -f "${pid_file}" ]]; then
        echo "錯誤: 服務未運行: ${server_name}" >&2
        return 1
    fi
    
    pids=($(cat "${pid_file}"))
    running=0
    for pid in "${pids[@]}"; do
        if kill -0 "${pid}" 2>/dev/null; then
            running=1
            break
        fi
    done
    
    if [[ ${running} -eq 0 ]]; then
        echo "錯誤: 服務已經停止: ${server_name}" >&2
        rm -f "${pid_file}"
        return 1
    fi
    
    for pid in "${pids[@]}"; do
        kill "${pid}" 2>/dev/null
    done
    sleep 5
    
    running=0
    for pid in "${pids[@]}"; do
        if kill -0 "${pid}" 2>/dev/null; then
            running=1
            kill -9 "${pid}" 2>/dev/null
        fi
    done
    
    rm -f "${pid_file}"
    echo "服務已停止: ${server_name}"
}

# 主命令處理
case "$1" in
    list)
        list
        ;;
    start)
        if [[ -z "$2" ]]; then
            echo "錯誤: 請指定服務名稱" >&2
            exit 1
        fi
        start "$2"
        ;;
    stop)
        if [[ -z "$2" ]]; then
            echo "錯誤: 請指定服務名稱" >&2
            exit 1
        fi
        stop "$2"
        ;;
    *)
        echo "用法: $0 {list|start|stop} [服務名稱]" >&2
        exit 1
        ;;
esac 