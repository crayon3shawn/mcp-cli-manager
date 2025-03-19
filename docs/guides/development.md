# 開發指南

本文檔說明如何參與 MCP CLI Manager 的開發。

## 開發環境設置

### CLI 工具要求

- Bash >= 4.0
- git
- curl
- shellcheck（用於代碼檢查）
- bats-core（用於測試）

### Server 環境要求

MCP Server 是基於 Node.js 的應用，需要：

- nvm（用於 Node.js 版本管理）
- Node.js >= 18.0.0（建議使用 nvm 安裝）
- npm >= 8.0.0

```bash
# 使用 nvm 安裝指定版本的 Node.js
nvm install 18.0.0
nvm use 18.0.0

# 確認版本
node --version  # 應該顯示 v18.0.0
npm --version   # 應該顯示 8.x.x
```

### 克隆倉庫

```bash
git clone https://github.com/crayon3shawn/mcp-cli-manager.git
cd mcp-cli-manager
```

## 項目結構

```
.
├── bin/                # 可執行文件
│   └── mcp            # 主程序
├── lib/               # 庫文件
│   ├── core/          # 核心模塊
│   ├── config/        # 配置管理
│   └── process/       # 進程管理
├── scripts/           # 腳本文件
│   └── install.sh     # 安裝腳本
├── test/              # 測試文件
│   ├── fixtures/      # 測試數據
│   └── *.bats        # 測試用例
└── docs/              # 文檔
    └── guides/        # 使用指南
```

## Shell 腳本規範

我們遵循 [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html) 的規範：

### 1. 文件格式

- 使用 `.sh` 後綴
- 使用 UTF-8 編碼
- 使用 LF 換行符
- 使用 2 空格縮進
- 最大行長度 80 字符

### 2. Shell 選項

每個腳本都應該以以下選項開始：

```bash
#!/bin/bash

set -euo pipefail
IFS=$'\n\t'
```

### 3. 命名規範

```bash
# 文件名
my_script.sh
test_server.sh

# 函數名（動詞_名詞）
start_server() {
  ...
}

validate_config() {
  ...
}

# 局部變量（小寫加下劃線）
local pid_file
local server_name

# 環境變量（大寫加下劃線）
readonly MCP_VERSION="1.0.0"
export MCP_CONFIG_DIR="/etc/mcp"
```

### 4. 註釋規範

```bash
# 文件頭部註釋
#!/bin/bash
#
# 進程管理模塊
# 用於管理服務器進程的啟動、停止和監控。

# 函數註釋
#######################################
# 啟動指定的服務器
# Globals:
#   MCP_CONFIG_DIR
#   MCP_LOG_DIR
# Arguments:
#   server_name: 服務器名稱
# Returns:
#   0: 成功
#   1: 失敗
#######################################
start_server() {
  ...
}
```

### 5. 錯誤處理

```bash
# 使用 set -e
set -e

# 使用 trap 處理錯誤
trap 'echo "錯誤：第 $LINENO 行"; exit 1' ERR

# 檢查命令返回值
if ! command -v curl &> /dev/null; then
  echo "錯誤：需要安裝 curl" >&2
  exit 1
fi
```

## 測試規範

### 1. CLI 工具測試

使用 bats-core 進行測試：

```bash
# 運行測試
./test/run.sh

# 指定測試文件
./test/run.sh test/process.bats
```

### 2. Server 測試環境

在運行 Server 相關測試前，確保：

1. 使用正確的 Node.js 版本：
```bash
nvm use 18.0.0
```

2. 檢查環境變量：
```bash
# 檢查 NODE_ENV
echo $NODE_ENV  # 應為 'test'

# 檢查 Server 配置
echo $MCP_SERVER_CONFIG  # 應指向測試配置文件
```

## 版本管理

### 1. 版本號格式

使用語義化版本：`MAJOR.MINOR.PATCH`

### 2. 發布流程

```bash
# 更新版本號
./scripts/version.sh bump minor

# 創建發布標籤
git tag -a "v1.0.0" -m "Release v1.0.0"
git push origin v1.0.0
```

## 代碼審查清單

- [ ] 符合 Shell 風格指南
- [ ] 通過 shellcheck 檢查
- [ ] 包含單元測試
- [ ] 更新相關文檔
- [ ] 測試覆蓋主要功能
- [ ] 錯誤處理完善
- [ ] 日誌輸出合理

## 故障排除

### 1. CLI 工具問題

```bash
# 運行 shellcheck
shellcheck lib/**/*.sh

# 修復常見問題
./scripts/lint.sh --fix
```

### 2. Server 環境問題

```bash
# Node.js 版本問題
nvm list  # 檢查已安裝的版本
nvm install 18.0.0  # 安裝需要的版本

# 環境檢查
./scripts/check-env.sh  # 檢查所有必要的環境變量和依賴

# 測試失敗
export NODE_ENV=test
./test/run.sh  # 重新運行測試
```

## 貢獻指南

1. Fork 項目
2. 創建功能分支
3. 遵循代碼規範
4. 添加測試用例
5. 提交 Pull Request

## 聯繫方式

- Issues: GitHub Issues
Github Issues 或是
- 郵件: crayon3shawn@example.com 

## 代碼風格和開發原則

### 1. 基本原則

- 保持簡單：避免不必要的複雜性
- 純 Shell 實現：盡量使用原生 Shell 命令，減少外部依賴
- 模塊化：功能應該清晰分離，避免重複代碼

### 2. 文件組織

```
lib/
  core/           # 核心模塊
    constants.sh  # 常量定義
    env.sh        # 環境變量管理
    log.sh        # 日誌功能
    utils.sh      # 通用工具函數
  process/        # 進程管理相關
  config/         # 配置管理相關
```

### 3. 代碼風格

#### 文件格式
```bash
#!/bin/bash
#
# 模塊簡短描述
# 詳細功能說明
#
# Dependencies:
#   - 依賴項1
#   - 依賴項2
#
# Usage:
#   使用方法

set -euo pipefail
IFS=$'\n\t'
```

#### 函數註解
```bash
#######################################
# 簡短的函數描述
# Args: 參數說明
# Returns: 返回值說明
#######################################
function_name() {
    # 實現
}
```

#### 變量命名
- 常量：全大寫加下劃線，如 `MAX_COUNT`
- 局部變量：小寫加下劃線，如 `local user_name`
- 環境變量：大寫加下劃線，前綴 MCP_，如 `MCP_CONFIG_DIR`

### 4. 配置管理

#### 必要配置字段
```yaml
name: server_name    # 服務器唯一標識
command: start.sh    # 啟動命令
args: --port 8080    # 命令參數
```

### 5. 開發規範

1. 錯誤處理
   - 使用 `set -e` 確保錯誤時退出
   - 使用 `set -u` 防止使用未定義的變量
   - 使用 `set -o pipefail` 確保管道命令錯誤被捕獲

2. 日誌規範
   - 使用統一的日誌函數
   - 合適的日誌級別
   - 包含足夠的上下文信息

3. 代碼組織
   - 相關功能放在同一個文件
   - 共用功能放在 core 目錄
   - 特定功能放在對應的子目錄

4. 測試
   - 使用 bats 進行單元測試
   - 測試文件命名：`*_test.bats`
   - 測試應該獨立且可重複執行

### 6. 注意事項

1. 避免重複代碼
   - 常量定義只在 `constants.sh`
   - 日誌函數只在 `log.sh`
   - 環境變量管理只在 `env.sh`

2. 依賴管理
   - 優先使用 Shell 內建命令
   - 必要的外部命令要在文件頭部聲明
   - 運行時檢查必要的命令是否存在

3. 安全性
   - 敏感信息使用環境變量
   - 文件權限合理設置
   - 注意命令注入風險

4. 可維護性
   - 清晰的函數和變量命名
   - 適當的註釋和文檔
   - 模塊化的代碼結構

### 7. 發布流程

1. 版本管理
   - 遵循語義化版本
   - 更新 `constants.sh` 中的版本號
   - 創建對應的 Git tag

2. 文檔更新
   - 更新 README.md
   - 更新使用指南
   - 更新更新日誌

3. 測試驗證
   - 運行所有測試
   - 在不同環境測試
   - 驗證安裝腳本 

## 進程管理

### 基本原則
1. 使用內存追蹤進程
   - 使用關聯數組 `MANAGED_PROCESSES` 追蹤進程
   - 避免使用 PID 文件，減少文件 I/O
   - 系統重啟時自動清理

2. 進程組管理
   - 每個服務器運行在獨立的進程組中
   - 使用 `set -m` 創建新進程組
   - 停止時優先停止整個進程組

3. 進程監控
   - 後台監控進程狀態
   - 意外停止時自動清理
   - 定期檢查進程健康狀態

### 代碼規範
1. 進程追蹤
```bash
# 使用關聯數組追蹤進程
declare -A MANAGED_PROCESSES
declare -A PROCESS_GROUPS

# 查找進程
find_process() {
    local server_name=$1
    local pid=${MANAGED_PROCESSES[$server_name]:-}
    # ...
}
```

2. 進程組管理
```bash
# 創建進程組
create_process_group() {
    local server_name=$1
    local pid=$2
    set -m
    PROCESS_GROUPS[$server_name]=$pid
    set +m
}

# 停止進程組
stop_process_group() {
    local server_name=$1
    local pid=$2
    kill -"${signals[$i]}" "-$pid" 2>/dev/null
}
```

3. 進程監控
```bash
# 監控進程
monitor_process() {
    local server_name=$1
    local pid=$2
    (
        while is_process_running "$pid"; do
            sleep "$check_interval"
        done
        cleanup_process "$server_name"
    ) &
}
```

### 注意事項
1. 進程管理
   - 避免使用 PID 文件
   - 優先使用進程組管理
   - 確保正確清理資源

2. 錯誤處理
   - 進程意外停止時自動清理
   - 提供詳細的錯誤訊息
   - 支持優雅停止

3. 性能考慮
   - 減少文件 I/O 操作
   - 使用內存追蹤進程
   - 避免不必要的進程搜索

### 最佳實踐
1. 進程啟動
   - 檢查環境依賴
   - 創建工作目錄
   - 設置進程組
   - 啟動監控

2. 進程停止
   - 優先停止進程組
   - 支持優雅停止
   - 清理所有資源

3. 進程監控
   - 定期檢查進程狀態
   - 記錄異常情況
   - 自動清理資源 

## Dependencies

### Core Principles
- Minimize external dependencies
- Use pure Bash implementation when possible
- Follow Unix philosophy of "Do One Thing and Do It Well"
- Ensure portability across different Unix-like systems

### Allowed Dependencies
- bash >= 4.0 (for associative arrays)
- Standard Unix commands:
  - `mkdir`, `cp`, `rm`, `mv` (file operations)
  - `chmod`, `chown` (permissions)
  - `ps`, `kill` (process management)
  - `grep`, `sed` (text processing, only if absolutely necessary)

### Forbidden Dependencies
- Node.js and npm packages
- Python scripts
- Perl scripts
- Ruby scripts
- Any other programming language interpreters
- External YAML parsers (like `yq`)
- External JSON parsers
- External configuration tools

### Implementation Guidelines
- Use Bash built-in features:
  - Associative arrays for data structures
  - Parameter expansion for string manipulation
  - Process substitution for command output
  - Here documents for multi-line strings
- Example:
  ```bash
  # Good: Using Bash built-in features
  declare -A config
  config["key"]="value"
  
  # Bad: Using external tools
  yq eval '.key' config.yaml
  ```