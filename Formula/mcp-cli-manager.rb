class McpCliManager < Formula
  desc "Command-line tool for managing Model Context Protocol servers"
  homepage "https://github.com/crayon3shawn/mcp-cli-manager"
  url "https://github.com/crayon3shawn/mcp-cli-manager/archive/refs/tags/v1.0.4.tar.gz"
  sha256 "d5558cd419c8d46bdc958064cb97f963d1ea793866414c025906ec15033512ed"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", "--production"
    bin.install "bin/mcp-cli-manager" => "mcp"
  end

  def caveats
    <<~EOS
      Configuration:
      The configuration directory will be created automatically at:
      ~/.cursor

      Example configuration (mcp.json):
      {
        "servers": {
          "github": {
            "type": "bin",
            "command": "/opt/homebrew/bin/mcp-server-github"
          },
          "sequential-thinking": {
            "type": "npx",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
          }
        }
      }
    EOS
  end
end 