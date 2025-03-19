# MCP CLI 管理工具產品需求文件 (PRD)

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

```
mcp <命令> [參數]
```

### 4.2 命令列表

| 命令 | 描述 | 參數 |
|------|------|------|
| help | 顯示幫助信息 | 無 |
| status | 顯示所有服務器狀態 | 無 |
| start | 啟動服務器 | [server]：指定服務器，不指定則啟動所有 |
| stop | 停止服務器 | [server]：指定服務器，不指定則停止所有 |
| restart | 重啟服務器 | [server]：指定服務器，不指定則重啟所有 |
| logs | 查看服務器日誌 | [server]：指定服務器 |
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

```
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

## 開發原則

### 1. 語言使用
- 代碼註釋、提交信息：英文
- 文檔：
  - 用戶文檔（README.md 等）：英文
  - 開發文檔（PRD.md 等）：中文
  - 錯誤信息：英文

### 2. 功能開發順序
1. 基礎配置管理
   - 配置文件讀寫
   - 配置導入導出
   - 配置格式轉換
2. 服務器管理
   - 啟動/停止
   - 狀態監控
3. 高級功能
   - 配置同步
   - 自動更新
   - 插件系統 