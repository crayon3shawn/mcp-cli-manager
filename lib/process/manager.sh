#!/bin/bash

# Import core modules
source "$(dirname "${BASH_SOURCE[0]}")/../core/env.sh"
source "$(dirname "${BASH_SOURCE[0]}")/../core/log.sh"
source "$(dirname "${BASH_SOURCE[0]}")/../config/loader.sh"

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

# Find process by server name
find_process() {
    local server_name=$1
    local method=${2:-"pgrep"}
    local pid
    
    case "$method" in
        "pgrep")
            pid=$(pgrep -f "$server_name")
            ;;
        "ps")
            pid=$(ps aux | grep "$server_name" | grep -v grep | awk '{print $2}')
            ;;
        *)
            log_error "Invalid process find method: $method"
            return 1
            ;;
    esac
    
    echo "$pid"
    return 0
}

# Check if process is running
is_process_running() {
    local pid=$1
    kill -0 "$pid" 2>/dev/null
}

# Stop process with timeout
stop_process() {
    local pid=$1
    local timeout=${2:-30}
    local signals=("TERM" "INT" "KILL")
    local wait_times=(5 3 2)
    
    for i in "${!signals[@]}"; do
        local signal="${signals[$i]}"
        local wait="${wait_times[$i]}"
        
        log_info "Sending SIG$signal to process $pid"
        kill -"$signal" "$pid" 2>/dev/null
        
        # Wait for process to stop
        local counter=0
        while is_process_running "$pid" && [ "$counter" -lt "$wait" ]; do
            sleep 1
            counter=$((counter + 1))
        done
        
        if ! is_process_running "$pid"; then
            return 0
        fi
    done
    
    log_error "Failed to stop process $pid"
    return 1
}

# Start server
start_server() {
    local server_name=$1
    local config
    
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
    
    # Get working directory
    local working_dir
    working_dir=$(echo "$config" | jq -r '.working_dir // "."')
    
    # Create working directory if it doesn't exist
    mkdir -p "$working_dir"
    
    # Get command and arguments
    local command
    command=$(echo "$config" | jq -r '.command')
    
    # Start server
    cd "$working_dir" || {
        log_error "Failed to change directory" \
                 "Directory: $working_dir" \
                 "Check if the directory exists and has correct permissions"
        return 1
    }
    
    # Run command in background
    nohup "$command" > "$MCP_LOG_DIR/$server_name.log" 2>&1 &
    
    # Wait for process to start
    sleep 1
    
    # Check if process started successfully
    pid=$(find_process "$server_name")
    if [ -z "$pid" ]; then
        log_error "Failed to start server" \
                 "Server: $server_name" \
                 "Check the log file for details: $MCP_LOG_DIR/$server_name.log"
        return 1
    fi
    
    log_success "Server started successfully" \
                "Server: $server_name (PID: $pid)"
    return 0
}

# Stop server
stop_server() {
    local server_name=$1
    local config
    
    # Get server configuration
    config=$(get_server_config "$server_name") || return 1
    
    # Find process
    local pid
    pid=$(find_process "$server_name")
    if [ -z "$pid" ]; then
        log_error "Server not running" \
                 "Server: $server_name" \
                 "Use 'mcp start $server_name' to start it"
        return 1
    fi
    
    # Stop process
    if stop_process "$pid"; then
        log_success "Server stopped successfully" \
                   "Server: $server_name"
        return 0
    else
        log_error "Failed to stop server" \
                 "Server: $server_name (PID: $pid)" \
                 "Try stopping it manually with: kill -9 $pid"
        return 1
    fi
}

# Get server status
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