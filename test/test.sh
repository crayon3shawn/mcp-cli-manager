#!/bin/bash

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Set environment variables
export PATH="$PROJECT_ROOT/bin:$PATH"
export MCP_CONFIG_PATH="$PROJECT_ROOT/test/test.conf"
export MCP_LOG_LEVEL="debug"

# Color definitions
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
    local test_name=$1
    local test_cmd=$2
    
    echo -n "Testing $test_name... "
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if eval "$test_cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Cleanup function
cleanup() {
    echo "Cleaning up..."
    rm -f "$MCP_CONFIG_PATH"
    rm -rf "/tmp/mcp"
}

# Setup
echo "Setting up test environment..."
cp "$PROJECT_ROOT/examples/test-servers.json" "$PROJECT_ROOT/test/"

# Run tests
echo "Running tests..."

# Test help command
run_test "help command" "mcp help"

# Test version command
run_test "version command" "mcp version"

# Test config import
run_test "import config" "mcp import $PROJECT_ROOT/examples/test-servers.json"

# Test list servers
run_test "list servers" "mcp list"

# Test start server
run_test "start server" "mcp start test-server"

# Test check status
run_test "check status" "mcp status test-server"

# Test view logs
run_test "view logs" "mcp logs test-server"

# Test stop server
run_test "stop server" "mcp stop test-server"

# Test restart server
run_test "restart server" "mcp restart test-server && mcp stop test-server"

# Display test results
echo
echo "Test Results:"
echo "============"
echo "Total tests: $TESTS_TOTAL"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

# Cleanup
cleanup

# Return test result
[ $TESTS_FAILED -eq 0 ] 