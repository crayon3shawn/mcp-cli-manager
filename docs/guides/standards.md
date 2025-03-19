# MCP CLI Manager 開發標準

## 1. 基本原則

### 1.1 Unix 哲學原則
請參考 [Unix 哲學詳細說明](../principles/unix.md) 了解完整的 Unix 哲學原則。

### 1.2 XDG 基礎目錄規範
請參考 [XDG 標準詳細說明](../principles/xdg.md) 了解完整的 XDG 基礎目錄規範。

## 2. 代碼風格

### 2.1 Shell Script 規範
- 使用 UTF-8 編碼
- 使用 LF 換行符
- 文件開頭必須包含 shebang: `#!/bin/bash`
- 文件權限設置為 755

### 2.2 命名規範
請參考 [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html#naming-conventions) 了解完整的命名規範。

主要規範包括：
- 文件名使用小寫字母，用下劃線分隔：`process_manager.sh`
- 函數名使用小寫字母，用下劃線分隔：`start_server()`
- 變量名使用小寫字母，用下劃線分隔：`server_name`
- 常量名使用大寫字母，用下劃線分隔：`DEFAULT_PORT`

### 2.3 註釋規範
- 每個文件開頭說明其用途
- 每個函數前說明其功能、參數和返回值
- 複雜邏輯需要添加註釋說明
- 使用英文註釋

### 2.4 函數設計
- 一個函數只做一件事
- 函數長度控制在 50 行以內
- 使用 local 聲明局部變量
- 明確的返回值（0 表示成功，非 0 表示失敗）

### 2.5 錯誤處理
- 使用 set -e 確保錯誤時退出
- 捕獲並處理可能的錯誤
- 提供有意義的錯誤信息
- 使用日誌函數記錄錯誤

### 2.6 安全實踐
- 使用引號包裹變量
- 使用 readonly 聲明常量
- 檢查命令執行結果
- 避免使用 eval

## 3. 配置規範

### 3.1 格式要求
- 使用 2 空格縮進
- 使用雙引號包裹鍵名
- 最後一個屬性後不加逗號

### 3.2 配置結構
- 按邏輯分組相關配置
- 避免深層嵌套
- 使用描述性的鍵名

## 4. 版本控制

### 4.1 Git 提交信息
- 使用中文
- 清晰描述改動內容
- 一次提交只做一件事

### 4.2 分支管理
- main：主分支
- dev：開發分支
- feature/*：功能分支
- fix/*：修復分支

## 5. 國際化標準

### CLI Messages and Logs
- All CLI messages, error messages, and logs MUST be in English
- This ensures the tool is accessible to users worldwide
- Example:
  ```bash
  # Good
  log_error "Server configuration not found" "Server: $server_name"
  
  # Bad
  log_error "服務器配置不存在" "服務器: $server_name"
  ```

### Code Comments
- All code comments MUST be in English
- This maintains consistency and makes the codebase accessible to developers worldwide
- Example:
  ```bash
  # Good
  # Check if server is running
  
  # Bad
  # 檢查服務器是否運行
  ```

### Documentation
- All documentation MUST be in English
- This includes:
  - README files
  - API documentation
  - Configuration guides
  - Error messages
  - Help text

### Configuration Files
- All configuration file comments and descriptions MUST be in English
- Example:
  ```yaml
  # Good
  servers:
    web:
      name: "Web Server"
      description: "Main web application server"
  
  # Bad
  servers:
    web:
      name: "網頁服務器"
      description: "主要網頁應用服務器"
  ```

### File Naming
- All file names MUST use English characters
- Use lowercase with hyphens for file names
- Example:
  ```
  # Good
  server-manager.sh
  config-loader.sh
  
  # Bad
  服務器管理器.sh
  config_loader.sh
  ```

## 實施指南

1. 在啟動時檢查並創建必要的目錄
2. 遵循系統特定的路徑約定
3. 提供環境變量覆蓋選項
4. 保持向後兼容性
5. 提供遷移工具（如果需要）

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