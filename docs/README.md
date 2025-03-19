# MCP CLI Manager 文檔

## 目錄結構

```
docs/
├── principles/           # 核心原則
│   ├── unix.md          # Unix 哲學原則
│   └── xdg.md           # XDG 基礎目錄規範
├── guides/              # 使用指南
│   ├── cli.md          # CLI 命令參考
│   ├── config.md       # 配置文件說明
│   └── development.md  # 開發指南
└── design/             # 設計文檔
    ├── architecture.md # 系統架構
    └── security.md     # 安全設計
```

## 文檔規範

1. **格式**
   - 使用 Markdown
   - 繁體中文為主，專業術語保持英文
   - 代碼塊標註語言類型

2. **維護**
   - 代碼變更時同步更新文檔
   - 重大變更需要在 commit 信息中說明 