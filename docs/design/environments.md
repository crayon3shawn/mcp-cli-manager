# 開發環境與生產環境差異

## 目錄結構差異

### 開發環境（Development）

開發環境位於專案目錄中，用於開發和測試：

```
mcp-cli-manager/                # 專案根目錄
├── bin/                        # 可執行文件
│   └── mcp                     # CLI 工具
├── lib/                        # 源代碼庫
│   ├── core/                   # 核心功能
│   ├── config/                 # 配置處理
│   ├── process/                # 進程管理
│   └── security/              # 安全相關
├── docs/                       # 文檔
├── tests/                      # 測試文件
├── config.yaml                 # 開發環境配置
├── servers.yaml               # 開發環境服務器配置
└── logs/                      # 開發環境日誌
```

### 生產環境（Production）

安裝到用戶系統後，遵循 XDG 規範的目錄結構：

#### Linux 系統
```
/usr/local/bin/mcp             # 可執行文件

/usr/local/lib/mcp-cli-manager/  # 庫文件
└── lib/                         # 源代碼庫

~/.local/share/mcp-cli-manager/  # 數據目錄
└── logs/                        # 日誌文件

~/.config/mcp-cli-manager/       # 配置目錄
├── config.yaml                  # 用戶配置
└── servers.yaml                # 服務器配置

~/.cache/mcp-cli-manager/        # 緩存目錄
└── temp/                        # 臨時文件
```

#### macOS 系統
```
/usr/local/bin/mcp             # 可執行文件

/usr/local/lib/mcp-cli-manager/  # 庫文件
└── lib/                         # 源代碼庫

~/Library/Application Support/mcp-cli-manager/  # 數據和配置目錄
├── logs/                        # 日誌文件
├── config.yaml                  # 用戶配置
└── servers.yaml                # 服務器配置

~/Library/Caches/mcp-cli-manager/  # 緩存目錄
└── temp/                          # 臨時文件
```

## 環境檢測

程式會自動檢測當前環境並使用相應的目錄結構：

```bash
# 環境檢測邏輯
if [ -f "./config.yaml" ]; then
    # 開發環境：使用本地目錄
    CONFIG_DIR="."
    DATA_DIR="."
    CACHE_DIR="./temp"
else
    # 生產環境：使用 XDG 目錄
    case "$(uname)" in
        "Darwin")
            CONFIG_DIR="$HOME/Library/Application Support/mcp-cli-manager"
            DATA_DIR="$CONFIG_DIR"
            CACHE_DIR="$HOME/Library/Caches/mcp-cli-manager"
            ;;
        *)
            CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/mcp-cli-manager"
            DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/mcp-cli-manager"
            CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/mcp-cli-manager"
            ;;
    esac
fi
```

## 配置差異

### 開發環境配置
- 配置文件位於專案目錄
- 日誌輸出更詳細
- 可能包含測試配置
- 環境變量可在 `.env` 文件中設置

### 生產環境配置
- 配置文件遵循 XDG 規範
- 日誌級別通常較高
- 不包含測試配置
- 環境變量應在系統中設置

## 安裝過程

當從開發環境安裝到生產環境時：

1. **創建必要目錄**
```bash
create_xdg_dirs() {
    # 創建 XDG 目錄
    mkdir -p "${DATA_DIR}/logs"
    mkdir -p "${CONFIG_DIR}"
    mkdir -p "${CACHE_DIR}/temp"
    
    # 設置權限
    chmod 700 "${DATA_DIR}" "${CONFIG_DIR}" "${CACHE_DIR}"
}
```

2. **複製默認配置**
```bash
copy_default_configs() {
    # 如果用戶配置不存在，複製默認配置
    if [ ! -f "${CONFIG_DIR}/config.yaml" ]; then
        cp ./config.yaml "${CONFIG_DIR}/"
    fi
    if [ ! -f "${CONFIG_DIR}/servers.yaml" ]; then
        cp ./servers.yaml "${CONFIG_DIR}/"
    fi
}
```

3. **設置權限**
- 配置文件：`0600`
- 日誌目錄：`0700`
- 可執行文件：`0755`

## 開發建議

1. **本地開發**
   - 使用專案目錄中的配置
   - 頻繁修改和測試
   - 可以使用 `make dev` 或類似命令運行

2. **測試安裝**
   - 定期測試安裝流程
   - 驗證 XDG 目錄結構
   - 確認權限設置

3. **調試技巧**
   - 開發環境：直接查看本地日誌
   - 生產環境：檢查 XDG 目錄中的日誌
   - 使用環境變量控制日誌級別 