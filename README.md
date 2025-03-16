# MCP CLI Manager (Model Context Protocol 命令行管理工具)

這是一個用於管理 Model Context Protocol (MCP) 服務器的命令行工具集。它提供了簡單的界面來管理多個 MCP 服務器，支持自動環境切換和狀態監控。

## 功能特點

- 🚀 自動環境切換（使用 fnm）
- 📊 服務器狀態監控
- 🔄 批量啟動/停止/重啟
- 🔌 擴展性支持
- 🎨 彩色命令行輸出
- 🔍 系統診斷功能

## 系統要求

- macOS 或 Linux 系統
- Zsh shell
- Node.js
- [fnm](https://github.com/Schniz/fnm) (Fast Node Manager)

## 快速安裝

```bash
# 克隆倉庫
git clone https://github.com/crayon3shawn/mcp-cli-manager.git

# 進入目錄
cd mcp-cli-manager

# 運行安裝腳本
./install.sh
```

## 手動安裝

1. 克隆倉庫：
   ```bash
   git clone https://github.com/crayon3shawn/mcp-cli-manager.git
   ```

2. 創建配置目錄：
   ```bash
   mkdir -p ~/.config/mcp-manager
   ```

3. 複製配置文件：
   ```bash
   cp conf/servers.conf ~/.config/mcp-manager/
   ```

4. 創建命令連接：
   ```bash
   sudo ln -sf "$(pwd)/bin/mcp" /usr/local/bin/mcp
   ```

## 使用方法

### 基本命令

- `mcp help` - 顯示幫助信息
- `mcp status` - 顯示所有服務器狀態
- `mcp start [server]` - 啟動服務器（不指定則啟動所有）
- `mcp stop [server]` - 停止服務器（不指定則停止所有）
- `mcp restart [server]` - 重啟服務器（不指定則重啟所有）
- `mcp doctor` - 診斷環境問題
- `mcp reload` - 重新載入配置

### 示例

```bash
# 啟動所有服務器
mcp start

# 只啟動 GitHub 服務器
mcp start github

# 檢查狀態
mcp status

# 停止所有服務器
mcp stop
```

## 配置

### 添加新服務器

1. 編輯 `~/.config/mcp-manager/servers.conf`：
   ```conf
   [server-name]
   command=執行命令
   process=進程名稱
   description=描述
   ```

2. 重新載入配置：
   ```bash
   mcp reload
   ```

## 故障排除

如果遇到問題：

1. 運行診斷：
   ```bash
   mcp doctor
   ```

2. 確認環境：
   ```bash
   fnm current  # 應該顯示 mcp-servers
   ```

3. 檢查日誌：
   ```bash
   mcp logs [server]
   ```

## 貢獻

歡迎提交 Pull Requests！

1. Fork 這個專案
2. 創建您的特性分支
3. 提交您的修改
4. 推送到分支
5. 創建新的 Pull Request

## 授權

MIT License - 查看 [LICENSE](LICENSE) 文件了解更多信息。 