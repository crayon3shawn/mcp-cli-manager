import chalk from 'chalk';
import { type SearchResult, type StatusInfo } from '../types.js';
import { TABLE_CONFIG } from './constants.js';

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return chalk.yellow('No servers found.');
  }

  const output: string[] = [];
  
  // Header
  output.push(chalk.bold('\nAvailable servers:'));
  
  // Table header
  const header = [
    chalk.cyan('NAME'),
    chalk.cyan('VERSION'),
    chalk.cyan('TYPE'),
    chalk.cyan('SOURCE'),
    chalk.cyan('DESCRIPTION')
  ].join('  ');
  output.push(header);
  
  // Separator
  output.push(chalk.dim('-'.repeat(header.length)));
  
  // Results
  results.forEach(result => {
    const row = [
      chalk.green(result.name),
      chalk.yellow(result.version || 'N/A'),
      chalk.blue(result.type),
      chalk.magenta(result.source),
      result.description || chalk.dim('No description')
    ].join('  ');
    output.push(row);
  });
  
  return output.join('\n');
}

export function formatListResults(servers: StatusInfo[], verbose: boolean): string {
  if (servers.length === 0) {
    return chalk.yellow('No servers found.');
  }

  const output: string[] = [];
  
  // Header
  output.push(chalk.bold('\nInstalled servers:'));
  
  // Calculate column widths
  const nameWidth = Math.max(
    TABLE_CONFIG.NAME_WIDTH,
    ...servers.map(s => s.name.length)
  );
  const statusWidth = TABLE_CONFIG.STATUS_WIDTH;
  
  // Table header
  const headerColumns = [
    chalk.cyan('NAME'.padEnd(nameWidth)),
    chalk.cyan('STATUS'.padEnd(statusWidth))
  ];
  if (verbose) {
    headerColumns.push(
      chalk.cyan('TYPE'.padEnd(10)),
      chalk.cyan('PID'.padEnd(8)),
      chalk.cyan('UPTIME'.padEnd(12))
    );
  }
  const header = headerColumns.join('  ');
  output.push(header);
  
  // Separator
  output.push(chalk.dim('-'.repeat(header.length)));
  
  // Results
  servers.forEach(server => {
    const statusColor = server.status === 'running' ? chalk.green : chalk.red;
    const columns = [
      chalk.bold(server.name.padEnd(nameWidth)),
      statusColor(server.status.padEnd(statusWidth))
    ];
    
    if (verbose) {
      columns.push(
        chalk.blue(server.type.padEnd(10)),
        server.pid ? chalk.yellow(server.pid.toString().padEnd(8)) : chalk.dim('N/A'.padEnd(8)),
        server.uptime ? chalk.magenta(formatUptime(server.uptime).padEnd(12)) : chalk.dim('N/A'.padEnd(12))
      );
    }
    
    output.push(columns.join('  '));
  });
  
  return output.join('\n');
}

function formatUptime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days}d`;
} 