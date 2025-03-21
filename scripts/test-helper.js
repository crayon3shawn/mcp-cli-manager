#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, type = 'info') {
  const color = type === 'success' ? colors.green : type === 'warning' ? colors.yellow : type === 'error' ? colors.red : '';
  console.log(`${color}${message}${colors.reset}`);
}

// 運行測試並生成覆蓋率報告
function runTestsWithCoverage() {
  try {
    log('Running tests with coverage...');
    execSync('jest --coverage', { stdio: 'inherit' });
    log('Tests completed successfully', 'success');
  } catch (error) {
    log('Tests failed', 'error');
    process.exit(1);
  }
}

// 檢查測試覆蓋率是否達標
function checkCoverageThreshold() {
  const coverageFile = 'coverage/coverage-final.json';
  if (!fs.existsSync(coverageFile)) {
    log('No coverage report found', 'error');
    return false;
  }

  const coverage = require(`../${coverageFile}`);
  const threshold = 80; // 設置覆蓋率門檻為 80%

  let totalStatements = 0;
  let coveredStatements = 0;

  Object.values(coverage).forEach(file => {
    totalStatements += Object.keys(file.statementMap).length;
    coveredStatements += Object.keys(file.s).filter(key => file.s[key] > 0).length;
  });

  const coveragePercent = (coveredStatements / totalStatements) * 100;
  
  if (coveragePercent >= threshold) {
    log(`Coverage: ${coveragePercent.toFixed(2)}% (threshold: ${threshold}%)`, 'success');
    return true;
  } else {
    log(`Coverage: ${coveragePercent.toFixed(2)}% (threshold: ${threshold}%)`, 'error');
    log('Coverage is below threshold', 'error');
    return false;
  }
}

// 清理測試文件
function cleanup() {
  const testArtifacts = [
    'coverage/',
    '.nyc_output/',
    'test-results.xml'
  ];

  testArtifacts.forEach(artifact => {
    if (fs.existsSync(artifact)) {
      if (fs.lstatSync(artifact).isDirectory()) {
        fs.rmdirSync(artifact, { recursive: true });
      } else {
        fs.unlinkSync(artifact);
      }
    }
  });
}

// 主函數
function main() {
  const args = process.argv.slice(2);
  
  switch (args[0]) {
    case 'coverage':
      runTestsWithCoverage();
      checkCoverageThreshold();
      break;
    case 'check-coverage':
      if (!checkCoverageThreshold()) {
        process.exit(1);
      }
      break;
    case 'cleanup':
      cleanup();
      log('Test artifacts cleaned up', 'success');
      break;
    default:
      log('Available commands:', 'info');
      log('  coverage      - Run tests with coverage report', 'info');
      log('  check-coverage - Check if coverage meets threshold', 'info');
      log('  cleanup       - Clean up test artifacts', 'info');
      break;
  }
}

main(); 