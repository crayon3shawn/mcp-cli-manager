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
- 討論: GitHub Discussions
- 郵件: your-email@example.com 