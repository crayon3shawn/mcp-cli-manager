#!/bin/bash

# Import core modules
source "$(dirname "${BASH_SOURCE[0]}")/../core/env.sh"
source "$(dirname "${BASH_SOURCE[0]}")/../core/log.sh"

# Define allowed commands and their descriptions
ALLOWED_COMMANDS=(
    "node:Node.js runtime"
    "python:Python interpreter"
    "python3:Python 3 interpreter"
    "java:Java runtime"
    "npm:Node.js package manager"
    "pip:Python package manager"
    "pip3:Python 3 package manager"
)

# Define dangerous patterns
DANGEROUS_PATTERNS=(
    "rm -rf /*"
    "rm -rf /"
    "> /dev/sda"
    "mkfs"
    ":(){:|:&};:"
    "dd if=/dev/zero"
    "dd if=/dev/random"
)

# Check if command is allowed
is_command_allowed() {
    local cmd=$1
    local base_cmd
    base_cmd=$(basename "$cmd")
    
    for entry in "${ALLOWED_COMMANDS[@]}"; do
        local allowed_cmd
        allowed_cmd="${entry%%:*}"
        if [ "$base_cmd" = "$allowed_cmd" ]; then
            return 0
        fi
    done
    return 1
}

# Get command description
get_command_description() {
    local cmd=$1
    local base_cmd
    base_cmd=$(basename "$cmd")
    
    for entry in "${ALLOWED_COMMANDS[@]}"; do
        local allowed_cmd
        local description
        allowed_cmd="${entry%%:*}"
        description="${entry#*:}"
        if [ "$base_cmd" = "$allowed_cmd" ]; then
            echo "$description"
            return 0
        fi
    done
    echo "Unknown command"
    return 1
}

# Validate command
validate_command() {
    local command=$1
    local args=$2
    
    # Check if command is empty
    if [ -z "$command" ]; then
        log_error "Invalid command" \
                 "Command is empty" \
                 "Provide a valid command"
        return 1
    fi
    
    # Get base command (without path)
    local base_command
    base_command=$(basename "$command")
    
    # Check if command is in whitelist
    if ! is_command_allowed "$command"; then
        local allowed_commands
        allowed_commands=$(printf "%s " "${ALLOWED_COMMANDS[@]%%:*}")
        log_error "Command not allowed: $base_command" \
                 "Command is not in the allowed list" \
                 "Use one of: $allowed_commands"
        return 1
    fi
    
    # Check for dangerous patterns in command and args
    local full_command="$command $args"
    for pattern in "${DANGEROUS_PATTERNS[@]}"; do
        if [[ "$full_command" == *"$pattern"* ]]; then
            log_error "Dangerous command pattern detected" \
                     "Command contains dangerous pattern: $pattern" \
                     "Review and modify the command"
            return 1
        fi
    done
    
    # Check if command exists in PATH
    if ! command -v "$command" &> /dev/null; then
        log_error "Command not found: $command" \
                 "Command is not installed or not in PATH" \
                 "Install the required command or check PATH"
        return 1
    fi
    
    return 0
}

# Validate file permissions
validate_file_permissions() {
    local file=$1
    local required_perms=${2:-644}
    
    # Check if file exists
    if [ ! -f "$file" ]; then
        log_error "File not found" \
                 "File does not exist: $file" \
                 "Check the file path"
        return 1
    fi
    
    # Get file permissions in octal
    local perms
    perms=$(stat -f "%Lp" "$file")
    
    # Check if permissions are too permissive
    if [ "$perms" -gt "$required_perms" ]; then
        log_error "Invalid file permissions" \
                 "File permissions too permissive: $perms (required: $required_perms)" \
                 "Fix permissions with: chmod $required_perms $file"
        return 1
    fi
    
    return 0
}

# Validate environment security
validate_env_security() {
    local issues=0
    
    # Check runtime directory permissions
    if [ -d "$MCP_RUNTIME_DIR" ]; then
        local runtime_perms
        runtime_perms=$(stat -f "%Lp" "$MCP_RUNTIME_DIR")
        if [ "$runtime_perms" -gt "755" ]; then
            log_error "Invalid runtime directory permissions" \
                     "Directory permissions too permissive: $runtime_perms" \
                     "Fix permissions with: chmod 755 $MCP_RUNTIME_DIR"
            issues=$((issues + 1))
        fi
    fi
    
    # Check PID directory permissions
    if [ -d "$MCP_PID_DIR" ]; then
        local pid_perms
        pid_perms=$(stat -f "%Lp" "$MCP_PID_DIR")
        if [ "$pid_perms" -gt "755" ]; then
            log_error "Invalid PID directory permissions" \
                     "Directory permissions too permissive: $pid_perms" \
                     "Fix permissions with: chmod 755 $MCP_PID_DIR"
            issues=$((issues + 1))
        fi
    fi
    
    # Check config file permissions
    if [ -f "$MCP_CONFIG_FILE" ]; then
        local config_perms
        config_perms=$(stat -f "%Lp" "$MCP_CONFIG_FILE")
        if [ "$config_perms" -gt "644" ]; then
            log_error "Invalid config file permissions" \
                     "File permissions too permissive: $config_perms" \
                     "Fix permissions with: chmod 644 $MCP_CONFIG_FILE"
            issues=$((issues + 1))
        fi
    fi
    
    return $issues
}

# Add command to whitelist
add_allowed_command() {
    local command=$1
    local description=${2:-"Custom command"}
    
    # Check if command already exists
    if is_command_allowed "$command"; then
        log_error "Command already in whitelist" \
                 "Command $command is already allowed" \
                 "Use a different command name"
        return 1
    fi
    
    # Add command to whitelist
    ALLOWED_COMMANDS+=("$command:$description")
    log_success "Added command to whitelist: $command ($description)"
}

# Remove command from whitelist
remove_allowed_command() {
    local command=$1
    local new_commands=()
    local found=false
    
    # Remove command from whitelist
    for entry in "${ALLOWED_COMMANDS[@]}"; do
        local cmd="${entry%%:*}"
        if [ "$cmd" != "$command" ]; then
            new_commands+=("$entry")
        else
            found=true
        fi
    done
    
    if [ "$found" = true ]; then
        ALLOWED_COMMANDS=("${new_commands[@]}")
        log_success "Removed command from whitelist: $command"
    else
        log_error "Command not in whitelist" \
                 "Command not found: $command" \
                 "Check command name"
        return 1
    fi
}

# List allowed commands
list_allowed_commands() {
    log_info "Allowed commands:"
    for entry in "${ALLOWED_COMMANDS[@]}"; do
        local cmd="${entry%%:*}"
        local description="${entry#*:}"
        echo "  $cmd: $description"
    done
}

# Main
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-}" in
        "validate-command")
            if [ -z "${2:-}" ]; then
                log_error "No command provided" \
                         "Command is required" \
                         "Usage: $0 validate-command <command> [args]"
                exit 1
            fi
            validate_command "$2" "${3:-}"
            ;;
        "validate-file")
            if [ -z "${2:-}" ]; then
                log_error "No file provided" \
                         "File path is required" \
                         "Usage: $0 validate-file <file> [perms]"
                exit 1
            fi
            validate_file_permissions "$2" "${3:-}"
            ;;
        "validate-env")
            validate_env_security
            ;;
        "add-command")
            if [ -z "${2:-}" ]; then
                log_error "No command provided" \
                         "Command is required" \
                         "Usage: $0 add-command <command> [description]"
                exit 1
            fi
            add_allowed_command "$2" "${3:-}"
            ;;
        "remove-command")
            if [ -z "${2:-}" ]; then
                log_error "No command provided" \
                         "Command is required" \
                         "Usage: $0 remove-command <command>"
                exit 1
            fi
            remove_allowed_command "$2"
            ;;
        "list-commands")
            list_allowed_commands
            ;;
        *)
            echo "Usage: ${0} {validate-command|validate-file|validate-env|add-command|remove-command|list-commands} [args...]" >&2
            exit 1
            ;;
    esac
fi 