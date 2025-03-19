# MCP CLI 管理工具產品需求文件 (PRD)

## 1. 產品概述與目標

### 1.1 產品定位
MCP CLI 管理工具是一個命令行工具，用於管理 Model Context Protocol (MCP) 服務器和環境。

### 1.2 核心目標
- 簡化 MCP 服務的管理流程
- 提供統一的命令行界面
- 確保跨平台兼容性（macOS/Linux）

### 1.3 目標用戶
- AI 開發者和研究人員
- MCP 開發工程師
- 系統管理員

## 2. 開發規範

### 2.1 技術棧
- Shell：zsh
- 依賴工具：
  - jq（JSON 處理）
  - fnm（Node.js 版本管理）

### 2.2 目錄結構
```
mcp-cli-manager/
├── bin/                # 可執行文件
├── lib/                # 核心邏輯
├── conf/               # 配置文件
├── docs/               # 文檔
├── test/               # 測試文件
└── examples/           # 示例
```

### 2.3 開發原則
1. **代碼規範**
   - 註釋語言：英文
     - 函數和模塊的頂部註釋必須包含功能描述
     - 複雜邏輯必須有行內註釋說明
     - 使用清晰的命名約定（Naming Conventions）
     - 保持註釋的簡潔性和專業性
   - 文檔語言：
     - 開發文檔：中文
     - 用戶文檔：英文
     - API 文檔：英文
   - 錯誤信息：英文
     - 包含錯誤原因（Reason）
     - 包含解決方案（Solution）
     - 使用標準的錯誤前綴（[ERROR], [WARN], etc.）

2. **配置管理**
   - 使用 .env 管理敏感信息
   - JSON 格式存儲配置
   - 支持多環境配置

## 3. 功能規格（按優先級排序）

### 3.1 第一階段：核心功能（必須）
- [ ] 服務器生命週期管理
  - 啟動/停止/重啟
  - 狀態檢查
  - PID 管理
- [ ] 配置文件管理
  - 讀取/寫入
  - 格式驗證
  - 導入/導出

### 3.2 第二階段：增強功能
- [ ] 環境管理
  - Node.js 版本控制
  - 依賴項管理
- [ ] 日誌系統
  - 日誌記錄
  - 日誌輪轉
  - 錯誤追蹤

### 3.3 第三階段：高級功能
- [ ] 監控系統
  - 性能監控
  - 資源使用
  - 告警機制
- [ ] 自動化
  - 自動重啟
  - 配置同步
  - 版本更新

## 4. 技術實現

### 4.1 核心模塊
1. **進程管理 (process.sh)**
   ```bash
   - start_server()    # 啟動服務器
   - stop_server()     # 停止服務器
   - restart_server()  # 重啟服務器
   - check_status()    # 檢查狀態
   ```

2. **工具函數 (utils.sh)**
   ```bash
   - log_message()     # 日誌記錄
   - load_env()        # 環境變量
   - validate_config() # 配置驗證
   ```

### 4.2 配置文件
1. **.env 文件**
   ```bash
   # API Keys（敏感信息）
   MCP_GITHUB_TOKEN=xxx
   MCP_OPENAI_KEY=xxx
   
   # 環境設置
   MCP_LOG_LEVEL=info
   MCP_CONFIG_PATH=/etc/mcp/config.json
   ```

2. **配置文件 (config.json)**
   ```json
   {
     "servers": {
       "dev": {
         "command": "node",
         "args": ["server.js"],
         "description": "Development server"
       }
     }
   }
   ```

### 4.3 命令行界面規範
1. **輸出格式**
   ```bash
   [OK] 成功信息
   [ERROR] 錯誤信息
   [WARN] 警告信息
   [INFO] 一般信息
   ```

2. **錯誤處理**
   ```bash
   [ERROR] Configuration Error
   Reason: Unable to read config file
   Solution: Check file permissions
   ```

## 5. 測試策略

### 5.1 測試範圍
1. **單元測試**
   - 配置管理
   - 進程控制
   - 工具函數

2. **集成測試**
   - 完整工作流
   - 錯誤處理
   - 性能測試

### 5.2 測試工具
- shunit2/bats：單元測試
- GitHub Actions：CI/CD

## 6. 發布計劃

### 6.1 版本規劃
1. v0.1.0：基礎功能
   - 服務器管理
   - 配置管理
   
2. v0.2.0：穩定版本
   - 日誌系統
   - 錯誤處理
   
3. v1.0.0：完整版本
   - 監控系統
   - 自動化功能

### 6.2 發布檢查清單
- [ ] 單元測試通過
- [ ] 文檔更新
- [ ] 更新日誌
- [ ] 版本標籤 