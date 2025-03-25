# Development Log

## 2024-03-21

### CI/CD 更新
- 創建了新的 GitHub Actions 工作流程文件：
  - `ci.yml`: 用於運行測試和代碼覆蓋率檢查
  - `release.yml`: 用於自動發布新版本
- 配置了以下功能：
  - 使用 pnpm 作為包管理器
  - Node.js 18.x 環境
  - 自動運行測試和代碼覆蓋率檢查
  - 自動發布到 npm
  - 自動創建 GitHub 發布

### 測試框架遷移
- 完成了從 Jest 到 Vitest 的遷移
- 更新了所有測試文件以使用 Vitest
- 配置了新的測試腳本：
  - `test`: 運行所有測試
  - `test:coverage`: 運行測試並生成覆蓋率報告
  - `test:ui`: 啟動 Vitest UI 界面
  - `test:watch`: 以監視模式運行測試

### 已完成
- 修復了 process.test.ts 中的測試問題
  - 導出 runningProcesses Map 以便測試
  - 更新測試用例以正確管理伺服器狀態
  - 所有 39 個測試現在都通過
  - 測試覆蓋率達到良好水平（process.ts 93.43%）

### 計劃中
- 使用 pnpm 優化專案
  1. 重構為 monorepo 結構
     ```
     mcp-cli-manager/
     ├── packages/
     │   ├── core/           # 核心功能
     │   ├── cli/            # CLI 工具
     │   ├── server/         # 伺服器相關
     │   └── shared/         # 共享工具和類型
     ├── pnpm-workspace.yaml
     └── package.json
     ```
  2. 優化依賴管理
     - 使用 pnpm 的進階功能
     - 改善開發體驗
     - 加強安全性檢查
  3. 效能優化
     - 使用硬連結和符號連結
     - 優化快取策略
     - 改善安裝速度
  4. CI/CD 優化
     - 整合 pnpm 到 CI 流程
     - 優化構建和測試流程
  5. 開發工具整合
     - VS Code 配置優化
     - 腳本優化
     - 依賴分析工具整合

### 下一步計劃
- [x] 刪除 Jest 相關文件
  - [x] 刪除 `cli/jest.config.js`
  - [x] 確認 `src/lib/types` 目錄下的類型定義文件已被移除
- [x] 更新其他測試文件
  - [x] 更新 `process.test.ts`
  - [x] 更新 `install.test.ts`
  - [x] 更新 `search.test.ts`
- [ ] 驗證 CI/CD 工作流程
- [ ] 更新文檔

### 遇到的問題
1. 在更新測試文件時遇到了一些類型錯誤：
   - `vitest` 模塊未找到：需要確保 `vitest` 已正確安裝並配置
   - 一些類型定義問題：需要更新或添加相應的類型定義文件
2. 需要處理的問題：
   - [x] 確認 `@types/vitest` 不需要安裝，因為 Vitest 已經包含了自己的類型定義
   - [x] 更新 `tsconfig.json` 以包含 Vitest 類型
   - [ ] 檢查並更新其他依賴項的類型定義
3. 修復的問題：
   - [x] 修復了 `mcp-cli-manager.ts` 中的 `installServer` 調用參數不匹配問題
   - [x] 修復了 `types.js` 的導入問題，將 `ConnectionTypeLiterals` 改為值導入
   - [x] 修復了 `process.js` 中的函數名稱問題，將 `runServer` 改為 `startServer`
   - [x] 修復了 `stopAllServers` 的實現，改為使用 `getInstalledServers` 和 `getServerStatus`

### 更新伺服器狀態檢查功能

1. 更新了 `process.ts` 以支持新的伺服器類型和連接方式：
   - 添加了對 Windsurf 和 Cline 的支持
   - 實現了基於連接類型的啟動和停止邏輯
   - 添加了錯誤處理和日誌記錄

2. 更新了 `status.ts` 以支持新的伺服器類型和連接方式：
   - 添加了對 Windsurf 和 Cline 的支持
   - 實現了基於連接類型的狀態檢查
   - 改進了錯誤處理和用戶友好的顯示

3. 更新了測試文件：
   - 添加了對新伺服器類型的測試
   - 添加了對不同連接方式的測試
   - 改進了錯誤處理的測試

### 遇到的問題

1. Jest 和 execa 的類型衝突：
   - 在測試中 mock execa 時遇到類型錯誤
   - 問題原因：Jest 的 mock 函數類型定義與 execa 的返回類型不匹配
   - 解決方案：
     ```typescript
     // 方案 1：使用 jest.MockedFunction
     const mockExeca = jest.fn() as jest.MockedFunction<typeof execa>;
     
     // 方案 2：使用 jest.Mock 並指定泛型
     const mockExeca = jest.fn() as jest.Mock<Promise<ExecaReturnValue>>;
     ```

2. 建議的改進方案：
   - 使用 `jest.spyOn` 替代直接 mock：
     ```typescript
     jest.spyOn(execa, 'execa').mockImplementation(async () => ({
       stdout: '',
       stderr: '',
       exitCode: 0,
       failed: false,
       killed: false,
       command: '',
       escapedCommand: '',
       timedOut: false,
       isCanceled: false,
       cwd: process.cwd()
     }));
     ```
   - 或者創建一個專門的 mock 工具：
     ```typescript
     // src/lib/__tests__/mocks.ts
     export const createMockExeca = (result: ExecaReturnValue) => {
       return jest.fn().mockResolvedValue(result) as jest.MockedFunction<typeof execa>;
     };
     ```

### 下一步計劃

1. 修復測試中的類型錯誤
2. 考慮使用更現代的測試方案，如 Vitest
3. 改進錯誤處理和日誌記錄
4. 添加更多的集成測試

## 2024-03-23

### 型別系統優化
1. 移除了 Jest 相關的型別定義和檔案
   - 刪除 `jest.config.js`
   - 刪除 `src/lib/types/jest.d.ts`
   - 刪除 `src/lib/types/execa.d.ts`
   - 刪除 `src/lib/types/npm-registry-fetch.d.ts`

2. 簡化了型別定義
   - 移除了不必要的 `readonly` 修飾符
   - 統一使用 TypeScript 的型別系統
   - 修復了 `GlobalConfig` 和 `ServerInfo` 的型別問題

3. 重構了配置管理
   - 移除了 `config.ts` 中的重複定義
   - 統一使用 `config/paths.ts` 中的路徑定義
   - 統一使用 `fs/json.ts` 中的 JSON 操作函數

4. 改進了 schema 定義
   - 修改了 `mcpServerSchema` 以包含 `name` 屬性
   - 確保 schema 和型別定義的一致性
   - 簡化了 `mcpServers` 到 `servers` 的轉換邏輯

### 待辦事項
1. 檢查其他檔案的型別問題
2. 考慮是否需要新的測試框架
3. 更新相關的測試檔案

## 2024-03-24

### 今日更新
1. 檢查 execa 使用情況
   - 檢查了 `install.ts` 和 `process.ts` 中 execa 的使用
   - 確認了 execa 的引用方式正確
   - 驗證了測試檔案中的 mock 設定

2. 測試系統改進
   - 修復了 `install.test.ts` 中的型別問題
   - 改進了 mock 函數的實現方式
   - 優化了測試案例的結構

3. 代碼質量改進
   - 統一了 mock 函數的使用方式
   - 改進了錯誤處理的測試覆蓋
   - 確保了型別安全性

### 待辦事項
1. [x] 考慮新增 Cursor 和 Claude 配置支援
   - 需要修改 `ServerType` 以包含新的類型
   - 擴展 `ServerInfo` 類型以支援新的配置選項
   - 更新 Zod schema 以驗證新的配置格式
   - 確保向後兼容性

2. [x] 完善其他模組的測試覆蓋
   - 添加更多錯誤處理的測試用例
   - 確保所有邊界情況都有測試覆蓋
   - 統一測試風格和結構

3. [x] 更新相關文檔
   - 更新使用文檔
   - 添加配置範例
   - 更新開發指南

### 下一步計劃
1. [ ] 開始實現 Cursor 和 Claude Client 的配置支援
   - 定義新的配置結構
   - 實現配置驗證
   - 添加相應的測試用例

2. [ ] 優化錯誤處理機制
   - 統一錯誤類型
   - 改進錯誤訊息
   - 添加錯誤追蹤

3. [ ] 改進文檔結構
   - 添加配置範例
   - 更新 API 文檔
   - 完善開發指南

### 注意事項
- 確保所有模組都正確使用 execa
- 保持測試的完整性和可維護性
- 考慮未來擴展的可能性
- 確保新功能與現有功能相容
- 保持配置格式的一致性
- 提供清晰的錯誤訊息

## 2024-03-25

### 清理專案文件
- 更新 .gitignore 配置，移除不必要的文件追蹤
- 實際刪除了以下文件：
  - cli/ 目錄（非專案文件）
  - homebrew-tap/ 目錄（獨立倉庫）
  - pnpm-lock 2.yaml（備份文件）
  - package-lock.json（使用 pnpm 作為包管理器）
- 從 git 中移除這些文件的追蹤

### 發布流程優化
- 修復 GitHub Actions 中 pnpm 安裝問題
- 將 pnpm/action-setup 替換為 npm install -g pnpm@8
- 統一版本號為 1.1.1
- 刪除未成功發布的 v1.1.0 和 v1.1.7 tag

### 文檔更新
- 修正 README.md 中的描述，確保正確描述 MCP (Model Context Protocol) 服務器
- 更新了安裝和使用說明
- 添加了開發指南

## 2024-03-26

### 命令更新
1. 將 `start` 命令改為 `run`，更符合 Minecraft 服務器的慣例
2. 添加了 `list` 命令，用於列出所有已安裝的服務器
3. 更新了命令的幫助信息，確保所有命令都在幫助中顯示

### 待辦事項
1. 修復 CLI 中的類型錯誤：
   - `runServer` 未導出
   - `ServerConfig` 類型中缺少 `version` 屬性

### 下一步計劃
1. 修復類型錯誤
2. 實現實際的服務器管理功能 