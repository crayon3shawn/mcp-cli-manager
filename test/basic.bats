#!/usr/bin/env bats

setup() {
  # 獲取測試目錄的絕對路徑
  TEST_DIR="$( cd "$( dirname "${BATS_TEST_FILENAME}" )" >/dev/null 2>&1 && pwd )"
  # 項目根目錄
  PROJECT_ROOT="$(dirname "$TEST_DIR")"
  # 將 bin 目錄添加到 PATH
  PATH="$PROJECT_ROOT/bin:$PATH"
  # 設置測試環境變量
  export MCP_TEST=1
  export MCP_CONFIG_DIR="$PROJECT_ROOT/test/fixtures"
}

@test "顯示幫助信息" {
  run "$PROJECT_ROOT/bin/mcp" --help
  [ "$status" -eq 0 ]
  [[ "${output}" =~ "Usage:" ]]
}

@test "顯示版本信息" {
  run "$PROJECT_ROOT/bin/mcp" --version
  [ "$status" -eq 0 ]
  [[ "$output" =~ "1.0.0" ]]
}

@test "列出服務器" {
  run "$PROJECT_ROOT/bin/mcp" list
  [ "$status" -eq 0 ]
}

@test "檢查配置文件" {
  [ -f "$PROJECT_ROOT/config.yaml.example" ]
  [ -f "$PROJECT_ROOT/servers.yaml.example" ]
  [ -f "$PROJECT_ROOT/.env.example" ]
}

@test "檢查必要的庫文件" {
  [ -f "$PROJECT_ROOT/lib/core/env.sh" ]
  [ -f "$PROJECT_ROOT/lib/core/log.sh" ]
  [ -f "$PROJECT_ROOT/lib/config/loader.sh" ]
  [ -f "$PROJECT_ROOT/lib/process/manager.sh" ]
}

@test "檢查無效命令" {
  run "$PROJECT_ROOT/bin/mcp" invalid-command
  [ "$status" -eq 1 ]
  [[ "${output}" =~ "Unknown command" ]]
}

@test "檢查缺少參數" {
  run "$PROJECT_ROOT/bin/mcp" start
  [ "$status" -eq 1 ]
  [[ "${output}" =~ "Server name required" ]]
} 