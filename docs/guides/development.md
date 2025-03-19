# 開發指南

## 開發環境設置

1. **克隆倉庫**
```bash
git clone https://github.com/yourusername/mcp-cli-manager.git
cd mcp-cli-manager
```

2. **安裝依賴**
```bash
npm install
```

3. **準備開發環境**
```bash
# 創建配置文件
cp config.yaml.example config.yaml
cp servers.yaml.example servers.yaml
cp .env.example .env

# 創建必要目錄
mkdir -p temp/logs
```

## 開發規範

### 代碼風格

1. **Shell 腳本**
   - 使用 shellcheck 進行語法檢查
   - 函數名使用小寫字母加下劃線
   - 變量名使用大寫字母加下劃線
   - 添加適當的註釋

2. **提交信息**
   - 使用現在時態
   - 第一行為簡短描述
   - 空一行後添加詳細說明
   - 標註相關 issue

### 測試

1. **單元測試**
```bash
# 運行所有測試
npm test

# 運行特定測試
npm test -- test/process.test.js
```

2. **集成測試**
```bash
# 運行集成測試
npm run test:integration
```

3. **本地測試**
```bash
# 啟動測試服務器
./bin/mcp start test-server

# 檢查狀態
./bin/mcp status test-server

# 查看日誌
./bin/mcp logs test-server
```

## 調試技巧

1. **日誌級別**
```bash
# 設置詳細日誌
export MCP_LOG_LEVEL=debug

# 運行命令
./bin/mcp start server-name
```

2. **調試模式**
```bash
# 啟用調試輸出
./bin/mcp --debug start server-name
```

3. **檢查配置**
```bash
# 驗證配置
./bin/mcp validate

# 查看當前配置
./bin/mcp config list
```

## 常見問題

1. **進程沒有正確停止**
   - 檢查 PID 文件
   - 確認進程狀態
   - 使用 force 選項

2. **配置無法加載**
   - 檢查文件權限
   - 驗證 YAML 格式
   - 確認環境變量

3. **日誌問題**
   - 檢查目錄權限
   - 確認磁盤空間
   - 查看系統日誌

## 發布流程

1. **版本更新**
```bash
# 更新版本號
npm version patch|minor|major
```

2. **測試檢查**
```bash
# 運行所有測試
npm test

# 檢查代碼風格
npm run lint
```

3. **文檔更新**
   - 更新版本說明
   - 檢查文檔準確性
   - 更新示例代碼

4. **發布**
```bash
# 推送到倉庫
git push origin main --tags

# 發布到 npm
npm publish
```

## 貢獻指南

1. **提交 Pull Request**
   - Fork 倉庫
   - 創建特性分支
   - 提交更改
   - 發起 Pull Request

2. **報告問題**
   - 使用 issue 模板
   - 提供詳細信息
   - 添加重現步驟

3. **代碼審查**
   - 遵循代碼規範
   - 添加測試用例
   - 更新相關文檔 