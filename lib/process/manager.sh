#!/bin/bash
#
# Process manager for MCP CLI Manager
# Handles server process lifecycle and monitoring
#
# Dependencies: bash>=4.0, ps, kill
# Source: source ./manager.sh

set -euo pipefail
IFS=$'\n\t'

# Import core modules
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../core/env.sh"
source "${SCRIPT_DIR}/../core/log.sh"
source "${SCRIPT_DIR}/../config/loader.sh"

# Process tracking
declare -A MANAGED_PROCESSES
declare -A PROCESS_GROUPS

#######################################
# Check Node.js environment
#######################################
check_node_env() {
    local required_version=${1:-18}
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed" \
                 "System requirement" \
                 "Please install Node.js v$required_version or higher"
        return 1
    }
    
    local current_version
    current_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    
    if [ "$current_version" -lt "$required_version" ]; then
        log_error "Node.js version is too old" \
                 "Current: v$current_version, Required: v$required_version" \
                 "Please upgrade Node.js to v$required_version or higher"
        return 1
    }
    
    log_debug "Using Node.js $(node -v)"
    return 0
}

#######################################
# Find process by server name
# Returns:
#   Process ID if found, empty string otherwise
#######################################
find_process() {
    local server_name=$1
    local pid=${MANAGED_PROCESSES[$server_name]:-}
    
    if [ -n "$pid" ] && is_process_running "$pid"; then
        echo "$pid"
        return 0
    fi
    
    # Fallback to process search if not in memory
    local found_pid
    found_pid=$(ps aux | grep "$server_name" | grep -v grep | awk '{print $2}' | head -n 1)
    
    # Update tracking if process found
    if [ -n "$found_pid" ] && is_process_running "$found_pid"; then
        MANAGED_PROCESSES[$server_name]=$found_pid
        echo "$found_pid"
        return 0
    fi
    
    # Clean up tracking if process not found
    unset MANAGED_PROCESSES[$server_name]
    return 1
}

#######################################
# Check if process is running
#######################################
is_process_running() {
    local pid=$1
    kill -0 "$pid" 2>/dev/null
}

#######################################
# Monitor process status
#######################################
monitor_process() {
    local server_name=$1
    local pid=$2
    local check_interval=${3:-$DEFAULT_CHECK_INTERVAL}
    
    (
        while is_process_running "$pid"; do
            sleep "$check_interval"
        done
        
        log_warn "Process stopped unexpectedly" \
                "Server: $server_name (PID: $pid)"
        cleanup_process "$server_name"
    ) &
}

#######################################
# Clean up process resources
#######################################
cleanup_process() {
    local server_name=$1
    unset MANAGED_PROCESSES[$server_name]
    log_debug "Cleaned up resources for $server_name"
}

#######################################
# Stop process with timeout
#######################################
stop_process() {
    local pid=$1
    local timeout=${2:-$DEFAULT_STOP_TIMEOUT}
    local signals=("TERM" "INT" "KILL")
    local wait_times=(5 3 2)
    
    for i in "${!signals[@]}"; do
        local signal="${signals[$i]}"
        local wait="${wait_times[$i]}"
        
        log_debug "Sending SIG$signal to process $pid"
        kill -"$signal" "$pid" 2>/dev/null || continue
        
        local counter=0
        while is_process_running "$pid" && [ "$counter" -lt "$wait" ]; do
            sleep 1
            counter=$((counter + 1))
        done
        
        if ! is_process_running "$pid"; then
            return 0
        fi
    done
    
    log_error "Failed to stop process" \
             "PID: $pid" \
             "Try stopping it manually with: kill -9 $pid"
    return 1
}

#######################################
# Create process group for server
#######################################
create_process_group() {
    local server_name=$1
    local pid=$2
    
    # Create new process group
    set -m
    PROCESS_GROUPS[$server_name]=$pid
    set +m
}

#######################################
# Stop process group
#######################################
stop_process_group() {
    local server_name=$1
    local pid=$2
    
    if [ -n "${PROCESS_GROUPS[$server_name]:-}" ]; then
        # 使用與 stop_process 相同的信號列表
        local signals=("TERM" "INT" "KILL")
        local wait_times=(5 3 2)
        
        for i in "${!signals[@]}"; do
            local signal="${signals[$i]}"
            local wait="${wait_times[$i]}"
            
            # 發送信號到整個進程組
            log_debug "Sending SIG$signal to process group -$pid"
            kill -"$signal" "-$pid" 2>/dev/null || true
            
            # 等待進程組終止
            local counter=0
            while is_process_running "$pid" && [ "$counter" -lt "$wait" ]; do
                sleep 1
                counter=$((counter + 1))
            done
            
            if ! is_process_running "$pid"; then
                unset PROCESS_GROUPS[$server_name]
                return 0
            fi
        done
        
        # 所有信號都發送失敗，記錄錯誤
        log_error "Failed to stop process group" \
                 "Server: $server_name, PID: $pid" \
                 "Try stopping it manually with: kill -9 -$pid"
    fi
    
    return 1
}

#######################################
# Start server
#######################################
start_server() {
    local server_name=$1
    local config
    
    # Check Node.js environment
    check_node_env || return 1
    
    # Get server configuration
    config=$(get_server_config "$server_name") || return 1
    
    # Check if server is already running
    local pid
    pid=$(find_process "$server_name")
    if [ -n "$pid" ]; then
        log_error "Server already running" \
                 "Server: $server_name (PID: $pid)" \
                 "Use 'mcp stop $server_name' to stop it first"
        return 1
    fi
    
    # Get working directory and create if needed
    local working_dir
    working_dir=$(echo "$config" | grep "working_dir:" | cut -d':' -f2- | tr -d ' ')
    working_dir=${working_dir:-.}
    mkdir -p "$working_dir"
    
    # Get command
    local command
    command=$(echo "$config" | grep "command:" | cut -d':' -f2- | tr -d ' ')
    if [ -z "$command" ]; then
        log_error "Invalid configuration" \
                 "Missing command for server: $server_name" \
                 "Add 'command:' field to the server configuration"
        return 1
    fi
    
    # Start server
    cd "$working_dir" || {
        log_error "Failed to change directory" \
                 "Directory: $working_dir" \
                 "Check if the directory exists and has correct permissions"
        return 1
    }
    
    # Start process in new process group
    nohup $command > "$MCP_LOG_DIR/$server_name.log" 2>&1 &
    local new_pid=$!
    
    # Track process and create process group
    MANAGED_PROCESSES[$server_name]=$new_pid
    create_process_group "$server_name" "$new_pid"
    
    # Wait for process to start
    sleep 1
    
    # Verify process is running
    if ! is_process_running "$new_pid"; then
        log_error "Failed to start server" \
                 "Server: $server_name" \
                 "Check the log file: $MCP_LOG_DIR/$server_name.log"
        cleanup_process "$server_name"
        return 1
    fi
    
    # Start monitoring
    monitor_process "$server_name" "$new_pid"
    
    log_success "Server started successfully" \
                "Server: $server_name (PID: $new_pid)"
    return 0
}

#######################################
# Stop server
#######################################
stop_server() {
    local server_name=$1
    
    # Find process
    local pid
    pid=$(find_process "$server_name")
    if [ -z "$pid" ]; then
        log_error "Server not running" \
                 "Server: $server_name" \
                 "Use 'mcp start $server_name' to start it"
        return 1
    fi
    
    # Try to stop process group first
    if stop_process_group "$server_name" "$pid"; then
        cleanup_process "$server_name"
        log_success "Server stopped successfully" \
                   "Server: $server_name"
        return 0
    fi
    
    # Fallback to individual process stop
    if stop_process "$pid"; then
        cleanup_process "$server_name"
        log_success "Server stopped successfully" \
                   "Server: $server_name"
        return 0
    fi
    
    return 1
}

#######################################
# Get server status
#######################################
get_server_status() {
    local server_name=$1
    local pid
    
    pid=$(find_process "$server_name")
    if [ -n "$pid" ] && is_process_running "$pid"; then
        echo "running"
    else
        echo "stopped"
    fi
}

#######################################
# Restart server
#######################################
restart_server() {
    local server_name=$1
    
    if [ "$(get_server_status "$server_name")" = "running" ]; then
        stop_server "$server_name" || return 1
    fi
    
    start_server "$server_name"
} 