# 配置文件說明

## 配置文件位置

### 開發環境
```
./config.yaml          # 主配置文件
./servers.yaml        # 服務器配置
./.env               # 環境變量
```

### 生產環境
```
~/.config/mcp-cli-manager/config.yaml    # Linux
~/Library/Application Support/mcp-cli-manager/config.yaml  # macOS
```

## 配置文件格式

### config.yaml

主配置文件，包含全局設置：

```yaml
# 系統配置
system:
  # 日誌配置
  log:
    directory: ${MCP_HOME}/logs  # 日誌目錄
    max_size: 10M               # 單個文件最大大小
    max_files: 5               # 保留文件數量
    level: info                # 日誌級別

  # 進程管理配置
  process:
    find_method: pgrep        # 進程查找方法
    name_pattern: "node-%s"   # 進程名稱模式
    start_timeout: 30         # 啟動超時（秒）
    stop_timeout: 30          # 停止超時（秒）
    health_check_interval: 5  # 健康檢查間隔（秒）
    stop_signals:            # 停止信號序列
      - signal: SIGTERM
        wait: 10
      - signal: SIGINT
        wait: 5
      - signal: SIGKILL
        wait: 0
```

### servers.yaml

服務器配置文件：

```yaml
servers:
  server-1:
    name: "測試服務器 1"
    description: "用於測試的 Node.js 服務器"
    command: "node server.js"
    cwd: "/path/to/server"
    env:
      NODE_ENV: "production"
      PORT: "3000"
    health_check:
      url: "http://localhost:3000/health"
      interval: 5
      timeout: 3
      retries: 3

  server-2:
    name: "測試服務器 2"
    description: "另一個測試服務器"
    command: "npm start"
    cwd: "/path/to/another/server"
    env:
      NODE_ENV: "production"
      PORT: "3001"
```

### .env

環境變量文件：

```bash
# API 密鑰
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GITHUB_API_TOKEN=your_token_here

# 系統設置
MCP_ENV=development
MCP_LOG_LEVEL=debug
```

## 配置驗證

使用以下命令驗證配置：

```bash
mcp validate
```

## 配置優先級

1. 命令行參數
2. 環境變量
3. .env 文件
4. 配置文件
5. 默認值

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