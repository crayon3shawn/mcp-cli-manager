#!/bin/bash
#
# Security validator module for MCP CLI Manager
# Validates command execution, file permissions and environment security
#
# Dependencies:
#   - bash >= 4.0
#
# Usage:
#   ./validator.sh <command> [args]
#
# Commands:
#   validate-command <command> [args] - Validate if command is allowed to execute
#   validate-file-permissions <file> [perms] - Validate file permissions
#   validate-env-security - Validate environment security settings
#   add-allowed-command <command> [description] - Add allowed command
#   remove-allowed-command <command> - Remove allowed command
#   list-allowed-commands - List all allowed commands
#
# Return values:
#   0: Validation successful
#   1: Validation failed
#   2: Parameter error
#
#
# Security considerations:
#   - This module contains sensitive security validation logic
#   - Changes need to be reviewed by security team
#   - Ensure file permissions are set correctly (recommended: 644)
#
# Example:
#   ./validator.sh validate-command "node" "script.js"
#   ./validator.sh validate-file-permissions "config.yaml" 644
#   ./validator.sh validate-env-security

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
    "chmod -R 777"
    "sudo rm"
    "|[\s]*rm"
    ";[\s]*rm"
    "&[\s]*rm"
    "$(.*)"
    "`.*`"
    ">[\s]*/etc"
    "2>[\s]*/dev/null"
)

# Define sensitive directories
SENSITIVE_DIRS=(
    "/etc"
    "/var"
    "/bin"
    "/sbin"
    "/lib"
    "/usr/bin"
    "/usr/sbin"
    "/usr/lib"
    "/boot"
    "/dev"
    "/proc"
    "/sys"
)

# Function name: is_command_allowed
# Description: Check if a command is in the allowed list
# Parameters:
#   $1: Command to check
# Returns:
#   0: Command is allowed
#   1: Command is not allowed
# Example:
#   is_command_allowed "node"
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

# Function name: get_command_description
# Description: Get the description of an allowed command
# Parameters:
#   $1: Command name
# Returns:
#   Command description (printed to stdout)
#   Empty string if command not found
# Example:
#   get_command_description "node"
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

# Function name: detect_command_injection
# Description: Detect command injection attempts in a command string
# Parameters:
#   $1: Command string to check
# Returns:
#   0: No injection detected
#   1: Possible injection detected
# Example:
#   detect_command_injection "ls; rm -rf /"
detect_command_injection() {
    local cmd=$1
    
    # Check shell operators
    if [[ "$cmd" =~ [';|&`] ]]; then
        log_error "Command injection detected" \
                 "Command contains shell operators: $cmd" \
                 "Remove shell operators like ; | & ` from the command"
        return 1
    fi
    
    # Check command substitutions
    if [[ "$cmd" =~ \$\([^\)]*\) || "$cmd" =~ \$\{[^\}]*\} ]]; then
        log_error "Command injection detected" \
                 "Command contains shell expansions: $cmd" \
                 "Remove command substitutions like \$(cmd) or \${var} from the command"
        return 1
    fi
    
    # Check redirections
    if [[ "$cmd" =~ [\<\>]{1,2} ]]; then
        log_error "Command injection detected" \
                 "Command contains redirections: $cmd" \
                 "Remove redirections like > or < from the command"
        return 1
    fi
    
    return 0
}

# Function name: check_path_traversal
# Description: Detect path traversal attempts in a file path
# Parameters:
#   $1: Path to check
# Returns:
#   0: Path is safe
#   1: Path traversal detected
# Example:
#   check_path_traversal "../etc/passwd"
check_path_traversal() {
    local path=$1
    
    # Check relative path traversal
    if [[ "$path" =~ (\.\./|\.\.) ]]; then
        log_error "Path traversal detected" \
                 "Path contains relative path traversal: $path" \
                 "Use absolute paths or remove .. from the path"
        return 1
    fi
    
    # Check sensitive directory access
    for dir in "${SENSITIVE_DIRS[@]}"; do
        if [[ "$path" == "$dir"* ]]; then
            log_error "Accessing sensitive directory" \
                     "Path trying to access protected directory: $dir" \
                     "Do not access system directories"
            return 1
        fi
    done
    
    # Check absolute path
    if [[ "$path" == /* ]] && [[ "$path" != "${MCP_CONFIG_DIR}"* ]] && \
       [[ "$path" != "${MCP_RUNTIME_DIR}"* ]] && [[ "$path" != "${MCP_LOG_DIR}"* ]]; then
        log_warn "Accessing absolute path outside MCP directories" \
                "Path: $path" \
                "Prefer using paths within MCP_CONFIG_DIR, MCP_RUNTIME_DIR, or MCP_LOG_DIR"
    fi
    
    return 0
}

# Function name: validate_command
# Description: Validate command security, including whitelist check and dangerous pattern detection
# Parameters:
#   $1: Command to execute
#   $2: Command arguments (optional)
# Returns:
#   0: Validation passed
#   1: Validation failed
# Security checks:
#   - Command is in whitelist
#   - No dangerous patterns
#   - Command exists in system
# Example:
#   validate_command "node" "script.js"
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
    
    # Check command injection
    local full_command="$command $args"
    if ! detect_command_injection "$full_command"; then
        return 1
    fi
    
    # Check for dangerous patterns in command and args
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

# Function name: validate_file_permissions
# Description: Validate if file permissions meet security requirements
# Parameters:
#   $1: File path
#   $2: Required permissions (default: 644)
# Returns:
#   0: Permissions meet requirements
#   1: Permissions do not meet requirements or file does not exist
# Example:
#   validate_file_permissions "config.yaml" 644
validate_file_permissions() {
    local file=$1
    local required_perms=${2:-644}
    
    # Check path traversal
    if ! check_path_traversal "$file"; then
        return 1
    fi
    
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

# Function name: validate_env_security
# Description: Validate environment security settings
# Parameters:
#   None
# Returns:
#   0: Environment is secure
#   1: Security issues detected
# Example:
#   validate_env_security
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

# Function name: add_allowed_command
# Description: Add a command to the allowed commands list
# Parameters:
#   $1: Command to add
#   $2: Command description (optional)
# Returns:
#   0: Command added successfully
#   1: Failed to add command
# Example:
#   add_allowed_command "npm" "Node package manager"
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

# Function name: remove_allowed_command
# Description: Remove a command from the allowed commands list
# Parameters:
#   $1: Command to remove
# Returns:
#   0: Command removed successfully
#   1: Failed to remove command or command not found
# Example:
#   remove_allowed_command "npm"
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

# Function name: list_allowed_commands
# Description: List all allowed commands with their descriptions
# Parameters:
#   None
# Returns:
#   0: Always succeeds
# Example:
#   list_allowed_commands
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