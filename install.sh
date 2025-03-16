#!/bin/bash

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 檢查系統要求
echo "${BLUE}🔍 檢查系統要求...${NC}"

# 檢查 zsh
if ! command -v zsh >/dev/null 2>&1; then
    echo "${RED}❌ 未安裝 Zsh${NC}"
    exit 1
fi

# 檢查 fnm
if ! command -v fnm >/dev/null 2>&1; then
    echo "${RED}❌ 未安裝 fnm${NC}"
    echo "${YELLOW}請先安裝 fnm：https://github.com/Schniz/fnm${NC}"
    exit 1
fi

# 創建配置目錄
echo "${BLUE}📁 創建配置目錄...${NC}"
mkdir -p ~/.config/mcp-manager

# 複製文件
echo "${BLUE}📋 複製配置文件...${NC}"
cp conf/servers.conf ~/.config/mcp-manager/
chmod +x bin/mcp

# 創建命令連接
echo "${BLUE}🔗 創建命令連接...${NC}"
if sudo ln -sf "$(pwd)/bin/mcp" /usr/local/bin/mcp; then
    echo "${GREEN}✅ 命令連接創建成功${NC}"
else
    echo "${RED}❌ 命令連接創建失敗${NC}"
    echo "${YELLOW}請手動執行：sudo ln -sf \"$(pwd)/bin/mcp\" /usr/local/bin/mcp${NC}"
fi

# 檢查 MCP 環境
echo "${BLUE}🔍 檢查 MCP 環境...${NC}"
if ! fnm current | grep -q "mcp-servers"; then
    echo "${YELLOW}⚠️ 未設置 MCP 環境${NC}"
    echo "${BLUE}🔄 設置 MCP 環境...${NC}"
    if fnm use mcp-servers; then
        echo "${GREEN}✅ MCP 環境設置成功${NC}"
    else
        echo "${RED}❌ MCP 環境設置失敗${NC}"
        echo "${YELLOW}請手動設置：fnm use mcp-servers${NC}"
    fi
fi

echo "${GREEN}✅ 安裝完成！${NC}"
echo "${BLUE}使用 'mcp help' 查看可用命令${NC}" 