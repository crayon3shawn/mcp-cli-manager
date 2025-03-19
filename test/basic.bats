#!/usr/bin/env bats

setup() {
  # Get absolute path of test directory
  TEST_DIR="$( cd "$( dirname "${BATS_TEST_FILENAME}" )" >/dev/null 2>&1 && pwd )"
  # Project root directory
  PROJECT_ROOT="$(dirname "$TEST_DIR")"
  # Add bin directory to PATH
  PATH="$PROJECT_ROOT/bin:$PATH"
  # Set test environment variables
  export MCP_TEST=1
  export MCP_CONFIG_DIR="$PROJECT_ROOT/test/fixtures"
  
  # Create test fixtures directory if it doesn't exist
  mkdir -p "$PROJECT_ROOT/test/fixtures"
  
  # Source required files for testing
  source "$PROJECT_ROOT/lib/core/log.sh"
  source "$PROJECT_ROOT/lib/core/env.sh"
}

teardown() {
  # Cleanup any test processes
  pkill -f "test_server" 2>/dev/null || true
  rm -f "$PROJECT_ROOT/test/fixtures/test_config.yaml" 2>/dev/null || true
  rm -f "$PROJECT_ROOT/test/fixtures/test_file.txt" 2>/dev/null || true
}

# Core CLI Tests
@test "Display help information" {
  run "$PROJECT_ROOT/bin/mcp" --help
  [ "$status" -eq 0 ]
  [[ "${output}" =~ "Usage:" ]]
}

@test "Display version information" {
  run "$PROJECT_ROOT/bin/mcp" --version
  [ "$status" -eq 0 ]
  [[ "$output" =~ "1.0.0" ]]
}

@test "List servers" {
  run "$PROJECT_ROOT/bin/mcp" list
  [ "$status" -eq 0 ]
}

@test "Check configuration files" {
  [ -f "$PROJECT_ROOT/config.yaml" ]
  [ -f "$PROJECT_ROOT/.env" ]
}

@test "Check required library files" {
  [ -f "$PROJECT_ROOT/lib/core/env.sh" ]
  [ -f "$PROJECT_ROOT/lib/core/log.sh" ]
  [ -f "$PROJECT_ROOT/lib/config/loader.sh" ]
  [ -f "$PROJECT_ROOT/lib/process/manager.sh" ]
  [ -f "$PROJECT_ROOT/lib/security/validator.sh" ]
}

@test "Check invalid command" {
  run "$PROJECT_ROOT/bin/mcp" invalid-command
  [ "$status" -eq 1 ]
  [[ "${output}" =~ "Unknown command" ]]
}

@test "Check missing parameters" {
  run "$PROJECT_ROOT/bin/mcp" start
  [ "$status" -eq 1 ]
  [[ "${output}" =~ "Server name required" ]]
}

# Process Manager Tests - Test our improved functions
@test "Process Manager - Create and validate process group" {
  source "$PROJECT_ROOT/lib/process/manager.sh"
  
  # Create a test process
  sleep 10 &
  local test_pid=$!
  
  # Register the process
  run create_process_group "test_server" "$test_pid"
  [ "$status" -eq 0 ]
  
  # Verify process group creation
  [[ -n "${PROCESS_GROUPS[test_server]}" ]]
  [ "${PROCESS_GROUPS[test_server]}" -eq "$test_pid" ]
  
  # Cleanup
  kill $test_pid 2>/dev/null || true
}

@test "Process Manager - Stop process group with signal sequence" {
  source "$PROJECT_ROOT/lib/process/manager.sh"
  
  # Create a test process
  sleep 10 &
  local test_pid=$!
  
  # Register the process
  create_process_group "test_server" "$test_pid"
  
  # Stop the process group
  run stop_process_group "test_server"
  [ "$status" -eq 0 ]
  
  # Verify process is stopped
  ! ps -p $test_pid > /dev/null 2>&1
  
  # Verify process group is removed
  [ -z "${PROCESS_GROUPS[test_server]:-}" ]
}

# Config Loader Tests - Test our implemented functions
@test "Config Loader - Parse YAML configuration" {
  source "$PROJECT_ROOT/lib/config/loader.sh"
  
  # Create a test YAML file
  cat > "$MCP_CONFIG_DIR/test_config.yaml" << EOF
server:
  name: test_server
  port: 8080
  settings:
    debug: true
    log_level: info
EOF
  
  # Parse the YAML file
  run parse_yaml "$MCP_CONFIG_DIR/test_config.yaml"
  [ "$status" -eq 0 ]
  
  # Verify parsing results
  [ "${CONFIG_VARS[server_name]}" = "test_server" ]
  [ "${CONFIG_VARS[server_port]}" = "8080" ]
  [ "${CONFIG_VARS[server_settings_debug]}" = "true" ]
  [ "${CONFIG_VARS[server_settings_log_level]}" = "info" ]
}

# Security Validator Tests - Test our enhanced security validation
@test "Security Validator - Allow whitelisted command" {
  source "$PROJECT_ROOT/lib/security/validator.sh"
  
  # Test with a command that should be in the whitelist
  if is_command_allowed "node"; then
    run validate_command "node" "script.js"
    [ "$status" -eq 0 ]
  else
    # Skip if node isn't in the whitelist
    skip "Node command not in whitelist"
  fi
}

@test "Security Validator - Detect command injection" {
  source "$PROJECT_ROOT/lib/security/validator.sh"
  
  # Command with injection attempt
  run detect_command_injection "ls; rm -rf /"
  [ "$status" -eq 1 ]
  [[ "${output}" =~ "Command injection detected" ]]
  
  # Another injection pattern
  run detect_command_injection "echo \$(cat /etc/passwd)"
  [ "$status" -eq 1 ]
  [[ "${output}" =~ "Command injection detected" ]]
}

@test "Security Validator - Detect path traversal" {
  source "$PROJECT_ROOT/lib/security/validator.sh"
  
  # Test with path traversal attempt
  run check_path_traversal "../etc/passwd"
  [ "$status" -eq 1 ]
  [[ "${output}" =~ "Path traversal detected" ]]
  
  # Test with sensitive directory access
  run check_path_traversal "/etc/shadow"
  [ "$status" -eq 1 ]
  [[ "${output}" =~ "Accessing sensitive directory" ]]
}

@test "Security Validator - Validate file permissions" {
  source "$PROJECT_ROOT/lib/security/validator.sh"
  
  # Create test file with specific permissions
  touch "$MCP_CONFIG_DIR/test_file.txt"
  chmod 644 "$MCP_CONFIG_DIR/test_file.txt"
  
  # Test with valid file path and permissions
  run validate_file_permissions "$MCP_CONFIG_DIR/test_file.txt" 644
  [ "$status" -eq 0 ]
  
  # Test with invalid permissions
  chmod 777 "$MCP_CONFIG_DIR/test_file.txt"
  run validate_file_permissions "$MCP_CONFIG_DIR/test_file.txt" 644
  [ "$status" -eq 1 ]
} 