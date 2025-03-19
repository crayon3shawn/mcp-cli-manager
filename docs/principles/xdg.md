# XDG 基礎目錄規範

## 概述

XDG 基礎目錄規範（XDG Base Directory Specification）定義了用戶特定的文件位置標準。這個規範幫助我們組織應用程序的文件，使其符合現代 Linux/Unix 系統的最佳實踐。

## 重要說明

本專案在不同環境下使用不同的目錄結構：
- **開發環境**：使用專案目錄中的文件，方便開發和測試
- **生產環境**：嚴格遵循 XDG 規範，確保系統整潔

詳細的環境差異說明請參考：[環境差異文檔](../design/environments.md)

## 環境變量

### 必要變量
- `$XDG_DATA_HOME`: 用戶特定的數據文件
- `$XDG_CONFIG_HOME`: 用戶特定的配置文件
- `$XDG_CACHE_HOME`: 用戶特定的非必要（緩存）數據
- `$XDG_RUNTIME_DIR`: 用戶特定的運行時文件

### 默認值
- `$XDG_DATA_HOME`: `~/.local/share`
- `$XDG_CONFIG_HOME`: `~/.config`
- `$XDG_CACHE_HOME`: `~/.cache`
- `$XDG_RUNTIME_DIR`: `/run/user/$UID`

## 生產環境目錄結構

### 1. 數據目錄 (`$XDG_DATA_HOME/mcp-cli-manager/`)
```
$XDG_DATA_HOME/mcp-cli-manager/
└── logs/
    ├── app.log      # 應用程序日誌
    └── error.log    # 錯誤日誌
```

用途：
- 日誌文件
- 運行時數據
- 其他持久化數據

### 2. 配置目錄 (`$XDG_CONFIG_HOME/mcp-cli-manager/`)
```
$XDG_CONFIG_HOME/mcp-cli-manager/
├── config.yaml    # 主配置文件
├── servers.yaml   # 服務器配置
└── .env          # 環境變量
```

用途：
- 用戶配置文件
- 服務器定義
- 環境變量

### 3. 緩存目錄 (`$XDG_CACHE_HOME/mcp-cli-manager/`)
```
$XDG_CACHE_HOME/mcp-cli-manager/
└── temp/         # 臨時文件
```

用途：
- 臨時文件
- 可重新生成的數據
- 下載的緩存

### 4. 運行時目錄 (`$XDG_RUNTIME_DIR/mcp-cli-manager/`)
```
$XDG_RUNTIME_DIR/mcp-cli-manager/
└── sockets/      # Unix 域套接字
```

用途：
- 套接字文件
- 命名管道
- 鎖文件

## 平台特定實現

### Linux
使用標準 XDG 目錄：
- 數據：`~/.local/share/mcp-cli-manager/`
- 配置：`~/.config/mcp-cli-manager/`
- 緩存：`~/.cache/mcp-cli-manager/`
- 運行時：`/run/user/$UID/mcp-cli-manager/`

### macOS
遵循 macOS 慣例：
- 數據：`~/Library/Application Support/mcp-cli-manager/`
- 配置：`~/Library/Application Support/mcp-cli-manager/`
- 緩存：`~/Library/Caches/mcp-cli-manager/`
- 運行時：`/var/run/user/$UID/mcp-cli-manager/`

## 實施指南

### 1. 目錄創建
```bash
# 在應用啟動時檢查並創建必要的目錄
create_xdg_dirs() {
    mkdir -p "${XDG_DATA_HOME:-$HOME/.local/share}/mcp-cli-manager/logs"
    mkdir -p "${XDG_CONFIG_HOME:-$HOME/.config}/mcp-cli-manager"
    mkdir -p "${XDG_CACHE_HOME:-$HOME/.cache}/mcp-cli-manager/temp"
    mkdir -p "${XDG_RUNTIME_DIR:-/run/user/$UID}/mcp-cli-manager/sockets"
}
```

### 2. 權限設置
- 數據目錄：`0700`
- 配置目錄：`0700`
- 緩存目錄：`0700`
- 運行時目錄：`0700`

### 3. 清理策略
- 運行時目錄：會話結束時清理
- 緩存目錄：定期清理
- 日誌文件：輪轉策略
- 臨時文件：使用後立即清理

### 4. 開發環境處理
在開發環境中：
1. 檢測是否在開發目錄中
2. 使用本地配置和日誌目錄
3. 保持與生產環境相同的目錄結構
4. 提供開發專用的配置選項

### 5. 遷移方案
對於從舊版本升級的用戶：
1. 檢測舊的配置位置
2. 複製文件到新位置
3. 創建備份
4. 更新配置引用 