# MCP CLI Manager 開發標準

## Unix 哲學原則

### 1. 單一職責原則
- 每個模塊只做一件事，並做好這件事
- 每個腳本文件應該有明確的職責
- 避免在單一模塊中混合多個功能

### 2. 組合性原則
- 模塊之間通過明確的接口進行通信
- 使用環境變量和配置文件進行參數傳遞
- 支持管道和重定向操作

### 3. 文本處理原則
- 使用純文本格式進行配置（YAML, ENV）
- 日誌使用標準文本格式
- 避免二進制格式

### 4. 可移植性原則
- 使用 POSIX 相容的 shell 語法
- 明確聲明依賴關係
- 提供跨平台支持

### 5. 透明性原則
- 提供清晰的錯誤信息
- 支持詳細的日誌記錄
- 命令執行狀態可查詢

## XDG 基礎目錄規範

### 1. 數據目錄
- Linux: `$XDG_DATA_HOME` (`~/.local/share/mcp-cli-manager/`)
- macOS: `~/Library/Application Support/mcp-cli-manager/`

包含：
- 日誌文件
- 運行時數據
- 其他持久化數據

### 2. 配置目錄
- Linux: `$XDG_CONFIG_HOME` (`~/.config/mcp-cli-manager/`)
- macOS: `~/Library/Application Support/mcp-cli-manager/`

包含：
- `config.yaml`
- `servers.yaml`
- `.env` 文件

### 3. 緩存目錄
- Linux: `$XDG_CACHE_HOME` (`~/.cache/mcp-cli-manager/`)
- macOS: `~/Library/Caches/mcp-cli-manager/`

包含：
- 臨時文件
- 緩存數據

### 4. 運行時目錄
- Linux: `$XDG_RUNTIME_DIR/mcp-cli-manager/`
- macOS: `/var/run/user/$UID/mcp-cli-manager/`

包含：
- 臨時運行時文件
- 套接字文件

## 目錄結構示例

```
$XDG_CONFIG_HOME/mcp-cli-manager/
├── config.yaml
├── servers.yaml
└── .env

$XDG_DATA_HOME/mcp-cli-manager/
└── logs/
    ├── app.log
    └── error.log

$XDG_CACHE_HOME/mcp-cli-manager/
└── temp/

$XDG_RUNTIME_DIR/mcp-cli-manager/
└── sockets/
```

## 實施指南

1. 在啟動時檢查並創建必要的目錄
2. 遵循系統特定的路徑約定
3. 提供環境變量覆蓋選項
4. 保持向後兼容性
5. 提供遷移工具（如果需要） 