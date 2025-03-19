#!/bin/zsh

# 基本設置
CONFIG_FILE="${HOME}/.cursor/mcp.json"
RUNTIME_DIR="${HOME}/.cursor/run"

# 確保運行時目錄存在
mkdir -p "${RUNTIME_DIR}"

# 讀取配置文件
mcp_load_config() {
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

# 讀取環境變數
mcp_load_env() {
    local env_file="${HOME}/.env"
    if [[ -f "${env_file}" ]]; then
        while IFS='=' read -r key value; do
            [[ -z "${key}" || "${key}" == \#* ]] && continue
            value=$(echo "${value}" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
            export "${key}=${value}"
        done < "${env_file}"
    fi
}

# 獲取服務配置
mcp_get_service_config() {
    local server_name="$1"
    local key="$2"
    jq -r ".mcpServers.${server_name}.${key}" "${CONFIG_FILE}"
} 