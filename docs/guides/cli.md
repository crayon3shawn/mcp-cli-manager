# CLI 命令參考

## 基本用法

```bash
mcp <命令> [選項] [參數]
```

## 可用命令

### 服務器管理

#### start
啟動指定的服務器
```bash
mcp start <server-name> [--force]
```
- `--force`: 強制啟動，即使服務器已在運行

#### stop
停止指定的服務器
```bash
mcp stop <server-name> [--force]
```
- `--force`: 強制停止，使用 SIGKILL 信號

#### restart
重啟指定的服務器
```bash
mcp restart <server-name> [--force]
```
- `--force`: 強制重啟

#### status
查看服務器狀態
```bash
mcp status [server-name]
```
- 不指定 server-name 時顯示所有服務器狀態

#### list
列出所有配置的服務器
```bash
mcp list [--format=<format>]
```
- `--format`: 輸出格式（text|json）

### 配置管理

#### config
查看或修改配置
```bash
mcp config [get|set] <key> [value]
```

#### validate
驗證配置文件
```bash
mcp validate [--config=<path>]
```

### 日誌管理

#### logs
查看服務器日誌
```bash
mcp logs <server-name> [--follow] [--lines=<n>]
```
- `--follow`: 持續查看日誌
- `--lines`: 顯示最後 n 行

## 全局選項

- `--help`: 顯示幫助信息
- `--version`: 顯示版本信息
- `--quiet`: 安靜模式，只輸出錯誤信息
- `--debug`: 調試模式，輸出詳細日誌

## 返回值

- `0`: 命令執行成功
- `1`: 一般錯誤
- `2`: 配置錯誤
- `3`: 運行時錯誤
- `4`: 權限錯誤

## 環境變量

- `MCP_CONFIG_DIR`: 配置目錄位置
- `MCP_LOG_LEVEL`: 日誌級別
- `MCP_ENV`: 運行環境（development|production）

## 使用示例

1. **啟動服務器**
```bash
mcp start my-server
```

2. **查看運行狀態**
```bash
mcp status my-server
```

3. **查看日誌**
```bash
mcp logs my-server --follow
```

4. **修改配置**
```bash
mcp config set log.level debug
``` 