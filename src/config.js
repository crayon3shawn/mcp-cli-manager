const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration file paths
const CONFIG_PATHS = {
  claude: path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json'),
  cursor: '.cursor/mcp/config.json',
  default: 'servers.conf'
};

// Check for existing configurations
function checkExistingConfigs() {
  const configs = [];
  
  if (fs.existsSync(CONFIG_PATHS.claude)) {
    configs.push({ type: 'claude', path: CONFIG_PATHS.claude });
  }
  
  if (fs.existsSync(CONFIG_PATHS.cursor)) {
    configs.push({ type: 'cursor', path: CONFIG_PATHS.cursor });
  }
  
  return configs;
}

// Read configuration file
function readConfig(configPath) {
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read configuration file: ${error.message}`);
  }
}

// Save configuration file
function saveConfig(config, configPath = CONFIG_PATHS.default) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    throw new Error(`Failed to save configuration file: ${error.message}`);
  }
}

// Import configuration
function importConfig(sourcePath) {
  const sourceConfig = readConfig(sourcePath);
  
  // Convert to standard format
  const standardConfig = {
    servers: {}
  };
  
  // Handle Claude format
  if (sourcePath === CONFIG_PATHS.claude && sourceConfig.mcpServers) {
    Object.entries(sourceConfig.mcpServers).forEach(([name, server]) => {
      standardConfig.servers[name] = {
        command: server.command,
        args: server.args || [],
        description: server.description || ''
      };
    });
  }
  // Handle Cursor format
  else if (sourcePath === CONFIG_PATHS.cursor) {
    // TODO: Add Cursor config conversion logic
  }
  
  return standardConfig;
}

module.exports = {
  checkExistingConfigs,
  readConfig,
  saveConfig,
  importConfig,
  CONFIG_PATHS
}; 