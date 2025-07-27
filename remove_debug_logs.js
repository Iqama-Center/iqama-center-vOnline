// Script to remove excessive console.log statements from the codebase
// Run this with: node remove_debug_logs.js

const fs = require('fs');
const path = require('path');

// Files to exclude from cleanup (keep debug logs in these)
const excludeFiles = [
  'lib/db.js', // Keep database connection logs
  'lib/queryOptimizer.js', // Keep query optimization logs
  'next.config.js'
];

// Directories to process
const directories = [
  'pages/api',
  'lib',
  'components',
  'services'
];

function removeDebugLogs(filePath) {
  if (excludeFiles.some(exclude => filePath.includes(exclude))) {
    console.log(`Skipping: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Remove standalone console.log statements
    content = content.replace(/^\s*console\.log\([^)]*\);\s*$/gm, '');
    
    // Remove console.log statements that are not in try-catch blocks
    content = content.replace(/(\s+)console\.log\([^)]*\);?\s*$/gm, '');
    
    // Keep console.error and console.warn for error handling
    // Only remove console.log statements
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Cleaned: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      removeDebugLogs(filePath);
    }
  });
}

console.log('Starting debug log cleanup...');
directories.forEach(processDirectory);
console.log('Debug log cleanup completed!');