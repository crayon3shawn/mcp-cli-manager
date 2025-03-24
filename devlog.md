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
1. [x] 考慮新增 Windsurf 和 Cline Client 配置支援
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
1. [ ] 開始實現 Windsurf 和 Cline Client 的配置支援
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

### Vitest 遷移計劃

1. 移除 Jest 相關依賴
   - 移除 `jest` 和 `@types/jest`
   - 移除 `jest.config.js`
   - 移除 Jest 相關的類型定義文件

2. 安裝 Vitest 相關依賴
   ```bash
   pnpm add -D vitest @vitest/coverage-v8 @testing-library/jest-dom
   ```

3. 配置 Vitest
   - 創建 `vitest.config.ts`
   - 配置 TypeScript 支持
   - 配置代碼覆蓋率報告
   - 配置測試環境

4. 更新測試文件
   - 將 `jest` 導入改為 `vitest`
   - 更新 mock 函數的實現
   - 更新斷言語法
   - 更新異步測試的寫法

5. 更新 package.json
   - 更新測試腳本
   - 添加覆蓋率報告腳本
   - 更新相關依賴版本

6. 更新 CI/CD 配置
   - 更新 GitHub Actions 工作流程
   - 更新測試和覆蓋率報告的生成
   - 確保 CI 環境中的 Node.js 版本兼容
   - 添加 Vitest 的緩存配置
   - 優化測試執行時間

### 遷移步驟
1. [x] 備份當前測試文件
2. [x] 移除 Jest 相關文件
3. [x] 安裝 Vitest 依賴
4. [x] 創建 Vitest 配置
5. [x] 更新測試文件
6. [ ] 驗證測試結果
7. [ ] 更新文檔
8. [ ] 更新 CI/CD 配置

### 預期收益
1. 更好的 TypeScript 支持
2. 更快的測試執行速度
3. 更現代的測試 API
4. 更好的開發體驗
5. 更完整的代碼覆蓋率報告

### 注意事項
- 確保所有測試都能正常運行
- 保持測試覆蓋率不降低
- 確保 CI/CD 流程正常
- 更新相關文檔
- 確保團隊成員了解新的測試框架

### CI/CD 更新計劃
1. 更新 GitHub Actions 工作流程
   ```yaml
   name: CI
   on:
     push:
       branches: [ main ]
     pull_request:
       branches: [ main ]

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: pnpm/action-setup@v2
         - uses: actions/setup-node@v4
           with:
             node-version: '18'
             cache: 'pnpm'
         - name: Install dependencies
           run: pnpm install
         - name: Run tests
           run: pnpm test
         - name: Run coverage
           run: pnpm test:coverage
         - name: Upload coverage
           uses: codecov/codecov-action@v4
   ```

2. 優化測試執行
   - 使用 Vitest 的並行執行功能
   - 配置測試緩存
   - 優化測試環境設置

3. 改進覆蓋率報告
   - 使用 `@vitest/coverage-v8` 生成詳細報告
   - 配置覆蓋率閾值
   - 自動上傳覆蓋率報告到 Codecov

4. 性能優化
   - 使用 Vitest 的智能緩存
   - 配置測試分組執行
   - 優化 CI 環境的資源使用

## 2024-03-26

### pnpm 工作空間設置
1. 創建了新的目錄結構：
   ```
   mcp-cli-manager/
   ├── packages/
   │   ├── core/           # 核心功能
   │   ├── cli/            # CLI 工具
   │   ├── server/         # 伺服器相關
   │   └── shared/         # 共享工具和類型
   ```

2. 添加了 pnpm-workspace.yaml 配置：
   ```yaml
   packages:
     - 'packages/*'
   ```

### 下一步計劃
1. [ ] 移動現有代碼到對應的包中
   - [ ] 將核心功能移至 core 包
   - [ ] 將 CLI 相關代碼移至 cli 包
   - [ ] 將伺服器相關代碼移至 server 包
   - [ ] 將共享工具和類型移至 shared 包

2. [ ] 更新 package.json 文件
   - [ ] 為每個包創建獨立的 package.json
   - [ ] 設置正確的依賴關係
   - [ ] 配置構建和測試腳本

3. [ ] 配置開發工具
   - [ ] 更新 VS Code 設置
   - [ ] 配置 TypeScript 路徑
   - [ ] 設置 ESLint 和 Prettier

4. [ ] 更新 CI/CD 配置
   - [ ] 修改 GitHub Actions 工作流程
   - [ ] 更新構建和測試腳本
   - [ ] 配置版本發布流程

### 重構進度
1. [x] 創建了新的目錄結構
2. [x] 添加了 pnpm-workspace.yaml 配置
3. [x] 創建了各個包的 package.json
4. [x] 創建了各個包的 tsconfig.json
5. [x] 移動了共享類型和工具到 shared 包
6. [x] 移動了核心功能到 core 包
7. [x] 創建了 server 包的基本結構
8. [x] 創建了 cli 包的基本結構

### 待解決問題
1. [ ] 修復 linter 錯誤
   - [ ] 修復 core 包中的 getServerStatus 導出衝突
   - [ ] 修復 server 包中的模組導入錯誤
   - [ ] 修復 cli 包中的模組導入錯誤

2. [ ] 移動測試文件
   - [ ] 將測試文件移動到對應的包中
   - [ ] 更新測試配置

3. [ ] 更新構建配置
   - [ ] 配置 TypeScript 構建
   - [ ] 配置測試環境
   - [ ] 配置 linting

4. [ ] 更新 CI/CD
   - [ ] 更新 GitHub Actions 工作流程
   - [ ] 配置版本發布流程 