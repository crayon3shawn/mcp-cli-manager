#!/bin/bash

# Import dependencies
source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"
source "$(dirname "${BASH_SOURCE[0]}")/config.sh"

# Start server
start_server() {
    local server_name=$1
    
    # Get server configuration
    local server_config
    if ! server_config=$(get_server_config "$server_name"); then
        return 1
    fi
    
    # Check if server is already running
    if is_server_running "$server_name"; then
        log_warn "Server '$server_name' is already running"
        return 0
    fi
    
    # Extract command and arguments
    local command
    local args
    command=$(echo "$server_config" | jq -r '.command')
    args=$(echo "$server_config" | jq -r '.args | join(" ")')
    
    # Create log directory
    local log_dir="/tmp/mcp/logs"
    mkdir -p "$log_dir"
    
    # Start server
    nohup $command $args > "$log_dir/$server_name.log" 2>&1 &
    local pid=$!
    
    # Check if started successfully
    if ps -p $pid > /dev/null; then
        log_success "Started server '$server_name' (PID: $pid)"
        # Save PID
        echo $pid > "$log_dir/$server_name.pid"
        return 0
    else
        log_error "Failed to start server '$server_name'" \
                 "Process died immediately" \
                 "Check logs at $log_dir/$server_name.log"
        return 1
    fi
}

# Stop server
stop_server() {
    local server_name=$1
    local pid_file="/tmp/mcp/logs/$server_name.pid"
    
    # Check PID file
    if [ ! -f "$pid_file" ]; then
        log_error "Server '$server_name' is not running" \
                 "PID file not found" \
                 "Start the server first with 'mcp start $server_name'"
        return 1
    fi
    
    # Read PID
    local pid
    pid=$(cat "$pid_file")
    
    # Check if process exists
    if ! ps -p $pid > /dev/null; then
        log_warn "Server '$server_name' is not running (stale PID file)"
        rm -f "$pid_file"
        return 0
    fi
    
    # Try graceful stop
    kill -TERM $pid
    
    # Wait for process to end
    local count=0
    while ps -p $pid > /dev/null && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done
    
    # If process is still running, force kill
    if ps -p $pid > /dev/null; then
        log_warn "Server '$server_name' not responding to SIGTERM, using SIGKILL"
        kill -9 $pid
    fi
    
    # Remove PID file
    rm -f "$pid_file"
    log_success "Stopped server '$server_name'"
    return 0
}

# Check server status
is_server_running() {
    local server_name=$1
    local pid_file="/tmp/mcp/logs/$server_name.pid"
    
    # Check PID file
    if [ ! -f "$pid_file" ]; then
        return 1
    fi
    
    # Read PID
    local pid
    pid=$(cat "$pid_file")
    
    # Check if process exists
    if ps -p $pid > /dev/null; then
        return 0
    else
        # Clean up stale PID file
        rm -f "$pid_file"
        return 1
    fi
}

# Get server status
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