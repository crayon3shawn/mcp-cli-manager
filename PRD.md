# MCP CLI Manager PRD

## 項目概述
MCP CLI Manager 是一個命令行工具，用於管理 Model Context Protocol (MCP) 服務器。該工具旨在簡化MCP服務器的管理流程，提供直觀的命令行界面來控制和監控服務器狀態。

## 核心功能需求

### 1. 服務器管理功能
#### 1.1 啟動服務器
- 支持啟動單個指定的服務器
- 支持同時啟動所有配置的服務器
- 啟動時顯示啟動進度和狀態

#### 1.2 顯示服務器狀態
- 顯示所有已配置服務器的運行狀態
- 顯示內容包括：
  - 服務器名稱
  - 運行狀態（運行中/已停止）
  - 進程ID（如果正在運行）
  - 運行時間
  - 描述信息

#### 1.3 停止服務器
- 支持停止單個指定的服務器
- 支持同時停止所有運行中的服務器
- 停止時確保進程正確終止

## 配置管理
### 當前方案討論
1. 使用本地配置文件
   - 在項目目錄下維護自己的 `servers.conf`
   - 優點：配置獨立，不影響其他工具
   - 缺點：需要單獨維護配置

2. 連接 Cursor 配置
   - 直接使用 Cursor 的 MCP 配置
   - 優點：配置統一，無需重複維護
   - 缺點：依賴 Cursor 的配置路徑

### 待確認事項
- [ ] 確定最終的配置文件方案
- [ ] 配置文件的格式和結構
- [ ] 配置文件的存放位置

## 技術考量
- 需要考慮跨平台兼容性
- 進程管理的可靠性
- 錯誤處理和日誌記錄

## 1. 產品概述

MCP CLI 管理工具是一個命令行工具，用於管理 Model Context Protocol (MCP) 服務器和環境。該工具旨在簡化 MCP 相關服務的啟動、停止、監控和管理過程，提高開發和使用效率。

## 2. 目標用戶

- AI 開發者和研究人員
- 使用 MCP 進行開發的工程師
- 需要管理多個 MCP 服務的系統管理員

## 3. 用戶需求

### 3.1 核心需求

- 能夠啟動、停止和重啟 MCP 服務器
- 查看所有 MCP 服務器的狀態
- 管理 Node.js 環境，特別是 MCP 專用環境
- 安裝和更新 MCP 依賴項
- 診斷環境問題

### 3.2 次要需求

- 查看服務器日誌
- 重新載入配置
- 顯示版本信息

## 4. 功能規格

### 4.1 命令結構

```bash
mcp <command> [options] [server_name]
```

### 4.2 命令列表

| 命令 | 描述 | 參數 |
|------|------|------|
| help | 顯示幫助信息 | 無 |
| status | 顯示所有服務器狀態 | 無 |
| start | 啟動服務器 | [server_name]：指定服務器，不指定則啟動所有 |
| stop | 停止服務器 | [server_name]：指定服務器，不指定則停止所有 |
| restart | 重啟服務器 | [server_name]：指定服務器，不指定則重啟所有 |
| logs | 查看服務器日誌 | [server_name]：指定服務器 |
| doctor | 診斷環境問題 | 無 |
| reload | 重新載入配置 | 無 |
| version | 顯示版本信息 | 無 |
| install | 安裝 MCP 依賴 | 無 |
| update | 更新 MCP 依賴 | 無 |

### 4.3 服務器類型

- github：GitHub 整合服務器
- filesystem：文件系統服務器
- puppeteer：Puppeteer 自動化服務器
- sequential：順序思維服務器

## 5. 技術規格

### 5.1 開發環境

- 使用 zsh 作為主要 shell
- 使用 fnm 管理 Node.js 版本
- 使用 jq 處理 JSON 數據

### 5.2 配置文件

- `servers.conf`：服務器配置文件
- `mcp-servers-versions.json`：版本和依賴配置文件

### 5.3 目錄結構

```
mcp-cli-manager/
├── bin/                # 可執行文件
│   └── mcp             # 主要命令行工具
├── conf/               # 配置文件
│   ├── servers.conf    # 服務器配置
│   └── mcp-servers-versions.json  # 版本配置
├── docs/               # 文檔
├── scripts/            # 輔助腳本
├── install.sh          # 安裝腳本
├── README.md           # 說明文檔
└── PRD.md              # 本產品需求文檔
```

## 6. 用戶界面

### 6.1 命令行輸出

- 使用純文本輸出，不依賴終端顏色支持
- 使用英文作為主要語言，確保跨平台兼容性
- 使用表情符號增強可讀性（✅, ❌, 🔍 等）

### 6.2 示例輸出

```bash
$ mcp status
🔍 Checking all server statuses...
✅ GitHub Integration Server is running
❌ File System Server is not running
✅ Puppeteer Automation Server is running
✅ Sequential Thinking Server is running
📊 Summary: 3/4 servers running
```

## 7. 安裝和配置

### 7.1 安裝步驟

1. 克隆倉庫
2. 運行安裝腳本
3. 配置 MCP 環境

### 7.2 環境要求

- zsh shell
- fnm (Fast Node Manager)
- jq (JSON 處理工具)
- Node.js

## 8. 兼容性和限制

- 主要支持 macOS 和 Linux 系統
- 在 Cursor 或其他 AI 集成的 IDE 中可能有部分功能限制
- 已在 Claude、GPT 和 Anthropic Claude 模型上測試

## 9. 未來擴展

- 添加 Web 界面進行可視化管理
- 支持更多類型的 MCP 服務器
- 添加性能監控功能
- 支持集群部署和管理

## 10. 開發時間線

- 第一階段：核心功能開發（啟動、停止、狀態檢查）
- 第二階段：環境管理和診斷功能
- 第三階段：日誌和版本管理
- 第四階段：測試和文檔完善

## 命令行界面設計

### 基礎命令結構
```bash
mcp <command> [options] [server_name]
```

### 核心命令
1. 啟動服務器
```bash
mcp start [server_name]     # 啟動指定服務器
mcp start --all            # 啟動所有服務器
```

2. 查看狀態
```bash
mcp status                 # 顯示所有服務器狀態
mcp status [server_name]   # 顯示指定服務器狀態
```

3. 停止服務器
```bash
mcp stop [server_name]     # 停止指定服務器
mcp stop --all            # 停止所有服務器
```

### 輸出格式
1. 狀態顯示
```
SERVER NAME     STATUS      PID     UPTIME      DESCRIPTION
github         Running     1234     2h 30m     GitHub 整合服務器
filesystem     Stopped     -        -          文件系統服務器
```

2. 操作反饋
- 啟動成功：✓ Started [server_name]
- 停止成功：✓ Stopped [server_name]
- 操作失敗：✗ Failed to [action] [server_name]: [error_message]

### 交互設計
- 啟動/停止多個服務器時顯示進度條
- 使用顏色區分不同狀態（運行中：綠色，已停止：灰色，錯誤：紅色）
- 支持 --help 顯示幫助信息
- 支持 --version 顯示版本信息 

## 配置管理設計

### 1. 配置文件檢測
- 自動檢測系統中已存在的 MCP 配置文件：
  - Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Cursor: `.cursor/mcp/config.json`
- 首次運行時提示用戶是否導入現有配置

### 2. 配置文件格式
```json
{
  "config_source": {
    "type": "custom | claude | cursor",
    "path": "配置文件路徑"
  },
  "servers": {
    "server-name": {
      "command": "命令",
      "args": ["參數1", "參數2"],
      "env": {
        "ENV_VAR": "環境變量值"
      },
      "enabled": true,
      "description": "服務器描述"
    }
  },
  "settings": {
    "auto_start": false,
    "log_level": "info",
    "log_file": "mcp-manager.log"
  }
}
```

### 3. 配置導入流程
1. 首次運行檢查
```bash
$ mcp init
✓ 檢測到以下配置文件：
  1. Claude Desktop 配置 (~/.config/claude/config.json)
  2. Cursor 配置 (.cursor/mcp/config.json)
  
是否要導入現有配置？[Y/n] Y

選擇要導入的配置文件 [1-2]: 1
✓ 成功導入 Claude Desktop 配置
✓ 配置文件已保存至 ./servers.conf
```

2. 手動導入
```bash
$ mcp import --from claude
$ mcp import --from cursor
$ mcp import --from <配置文件路徑>
```

### 4. 配置同步
- 支持與源配置文件保持同步
- 可以選擇自動或手動同步
- 同步時保留本地修改的優先級

### 5. 配置導出
```bash
$ mcp export --to claude    # 導出為 Claude 格式
$ mcp export --to cursor    # 導出為 Cursor 格式
$ mcp export --to <路徑>    # 導出到指定路徑
```

### 6. 配置文件優先級
1. 命令行參數
2. 項目級配置（./servers.conf）
3. 用戶級配置（~/.config/mcp-cli/servers.conf）
4. 導入的外部配置 