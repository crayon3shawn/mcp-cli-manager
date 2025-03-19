# 開發指南

本文檔說明如何參與 MCP CLI Manager 的開發。

## 開發環境設置

### 系統要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- git
- curl
- Bash >= 4.0

### 克隆倉庫

```bash
git clone https://github.com/crayon3shawn/mcp-cli-manager.git
cd mcp-cli-manager
```

### 安裝依賴

```bash
# 安裝開發依賴
npm install

# 檢查依賴版本
npm outdated
```

## 項目結構

```
.
├── bin/                # 可執行文件
│   └── mcp            # 主程序
├── lib/               # 庫文件
│   ├── core/          # 核心模塊
│   ├── config/        # 配置管理
│   └── process/       # 進程管理
├── scripts/           # 腳本文件
│   └── install.sh     # 安裝腳本
├── test/              # 測試文件
│   ├── fixtures/      # 測試數據
│   └── *.bats        # 測試用例
└── docs/              # 文檔
    └── guides/        # 使用指南
```

## 開發流程

### 1. 創建分支

```bash
# 功能分支
git checkout -b feature/your-feature

# 修復分支
git checkout -b fix/your-fix
```

### 2. 代碼風格

- 使用 2 空格縮進
- 使用 LF 換行符
- 文件使用 UTF-8 編碼
- Shell 腳本遵循 [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)

### 3. 測試

#### 單元測試

使用 [Bats](https://github.com/bats-core/bats-core) 進行測試：

```bash
# 運行所有測試
npm test

# 運行特定測試
npm test test/specific.bats
```

#### 測試覆蓋率

```bash
# 生成覆蓋率報告
npm run coverage
```

### 4. 文檔

- 所有新功能必須添加文檔
- 文檔使用繁體中文編寫
- 代碼註釋使用繁體中文
- 提交信息使用英文

### 5. 提交規範

提交信息格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

類型（type）：
- feat: 新功能
- fix: 錯誤修復
- docs: 文檔更新
- style: 代碼格式
- refactor: 代碼重構
- test: 測試相關
- chore: 構建過程或輔助工具的變動

### 6. 代碼審查

- 所有代碼必須經過審查
- 確保測試通過
- 確保文檔更新
- 遵循代碼規範

## 發布流程

### 1. 版本管理

使用語義化版本：

```bash
# 更新版本號
npm version [major|minor|patch]

# 生成更新日誌
npm run changelog
```

### 2. 測試發布

```bash
# 創建測試包
npm pack

# 本地安裝測試
npm install -g ./mcp-cli-manager-*.tgz
```

### 3. 正式發布

```bash
# 發布到 npm
npm publish

# 創建 Git 標籤
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## 故障排除

### 常見問題

1. 依賴安裝失敗
```bash
# 清理 npm 緩存
npm cache clean --force

# 重新安裝
rm -rf node_modules
npm install
```

2. 測試失敗
```bash
# 檢查測試環境
npm run test:env

# 查看詳細日誌
npm run test -- --verbose
```

### 調試

1. 啟用調試日誌
```bash
export MCP_LOG_LEVEL=debug
```

2. 使用調試模式運行
```bash
bash -x bin/mcp command
```

## 貢獻指南

1. Fork 項目
2. 創建功能分支
3. 提交更改
4. 推送到分支
5. 創建 Pull Request

## 聯繫方式

- Issues: GitHub Issues
- 討論: GitHub Discussions
- 郵件: your-email@example.com 