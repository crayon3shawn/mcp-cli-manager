class McpCliManager < Formula
  desc "MCP CLI Manager - 用於管理 Model Context Protocol 服務的命令行工具"
  homepage "https://github.com/crayon3shawn/mcp-cli-manager"
  url "https://github.com/crayon3shawn/mcp-cli-manager/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "YOUR_TARBALL_SHA256"
  license "MIT"

  depends_on "zsh"
  depends_on "screen"

  def install
    bin.install "cli/mcp"
    prefix.install "cli/core"
  end

  def caveats
    <<~EOS
      請確保創建配置文件：
      mkdir -p ~/.cursor
      touch ~/.cursor/mcp.json

      配置文件示例：
      {
        "mcpServers": {
          "github": {
            "command": "/opt/homebrew/bin/mcp-server-github",
            "args": [],
            "env": {
              "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
            }
          }
        }
      }
    EOS
  end
end 