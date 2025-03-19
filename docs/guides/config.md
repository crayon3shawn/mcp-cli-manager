# 配置指南

本文檔說明如何配置 MCP CLI Manager。

## 配置文件位置

配置文件默認存放在以下位置：

```bash
${HOME}/.config/mcp-cli-manager/
├── config.yaml    # 全局配置
├── servers.yaml   # 服務器配置
└── .env          # 環境變量
```

## 服務器配置 (servers.yaml)

服務器配置文件使用 YAML 格式，支持通過註釋控制功能的開啟和關閉。

### 基本結構

```yaml
# MCP CLI Manager 服務器配置
# 要啟用服務器，請移除 enabled: false 的註釋

servers:
  my-server:
    #enabled: false  # 取消註釋以停用服務器
    name: "我的服務器"
    description: "服務器描述"
    command: "node server.js"
    working_dir: "/path/to/server"
    env:
      NODE_ENV: "production"
      PORT: "3000"
```

### 可選功能

通過註釋控制的可選功能：

```yaml
servers:
  my-server:
    # ... 基本配置 ...
    
    #ports:              # 端口配置（可選）
    #  - 3000
    #  - 3001
    
    #health_check:       # 健康檢查配置（可選）
    #  url: "http://localhost:3000/health"
    #  interval: "5s"
    #  timeout: "3s"
    #  retries: 3
    
    #log:               # 日誌配置（可選）
    #  file: "server.log"
    #  level: "info"
    #  format: "json"
```

## 全局配置 (config.yaml)

全局配置文件同樣支持通過註釋控制功能的開啟和關閉。

### 基本結構

```yaml
# MCP CLI Manager 全局配置
# 取消註釋以啟用相應功能

logging:
  level: info        # 必需：日誌級別
  #format: text      # 可選：日誌格式
  #file: mcp.log    # 可選：日誌文件
  #max_size: 10MB   # 可選：日誌文件大小限制
  #max_files: 5     # 可選：保留的日誌文件數量

process:
  find_method: pgrep           # 必需：進程查找方法
  name_pattern: "%s"          # 必需：進程名稱模式
  #start_timeout: 30s         # 可選：啟動超時時間
  #stop_timeout: 30s         # 可選：停止超時時間
  #health_check_interval: 5s  # 可選：健康檢查間隔
```

### 進程控制配置

通過註釋控制的進程管理選項：

```yaml
process:
  # ... 基本配置 ...
  
  #stop_signals:           # 停止信號序列（可選）
  #  - signal: SIGTERM
  #    wait: 5s
  #  - signal: SIGINT
  #    wait: 3s
  #  - signal: SIGKILL
  #    wait: 0s
```

## 環境變量 (.env)

環境變量文件用於存儲敏感信息，同樣支持通過註釋控制。

### 基本結構

```bash
# MCP CLI Manager 環境變量
# 取消註釋並填入您的 API 密鑰

#ANTHROPIC_API_KEY=your_key_here
#OPENAI_API_KEY=your_key_here
#GITHUB_API_TOKEN=your_token_here
```

## 配置優先級

1. 命令行參數
2. 環境變量
3. .env 文件
4. 配置文件 (config.yaml, servers.yaml)
5. 默認值

## 配置驗證

系統會在加載配置時進行驗證：

1. 必需字段檢查
2. 數據類型驗證
3. 值範圍檢查
4. 依賴關係驗證

如果發現配置錯誤，系統會提供詳細的錯誤信息和修復建議。

## 敏感信息處理

- 敏感信息應存放在 `.env` 文件中
- 生產環境應使用系統環境變量
- 不要將含有實際密鑰的 `.env` 文件提交到版本控制系統

## 配置最佳實踐

1. **使用示例文件**
   - 提供 `config.yaml.example`
   - 提供 `servers.yaml.example`
   - 提供 `.env.example`

2. **文檔化配置項**
   - 註釋每個配置項的用途
   - 說明可選值和默認值
   - 提供配置示例

3. **環境隔離**
   - 開發環境使用本地配置
   - 測試環境使用專門配置
   - 生產環境使用系統配置

4. **定期檢查**
   - 驗證配置有效性
   - 更新過期的配置
   - 移除未使用的配置

## Configuration Format

### Simple Text Format
- Use simple text formats for configuration:
  - Key-value pairs
  - Space-separated values
  - Line-based records
- Avoid complex formats:
  - JSON
  - XML
  - YAML (unless using simple key-value structure)
- Example:
  ```bash
  # Good: Simple key-value format
  name=web-server
  port=8080
  enabled=true
  
  # Bad: Complex YAML structure
  servers:
    web:
      config:
        ports:
          - 8080
          - 8443
  ```

### Configuration Parsing
- Use pure Bash implementation for parsing
- Avoid external tools and dependencies
- Example:
  ```bash
  # Good: Using Bash built-in features
  while IFS= read -r line; do
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      value="${BASH_REMATCH[2]}"
      config["$key"]="$value"
    fi
  done < config.txt
  
  # Bad: Using external tools
  yq eval '.key' config.yaml
  ``` 