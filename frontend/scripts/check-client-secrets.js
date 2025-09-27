#!/usr/bin/env node

/**
 * Security check: Ensure no server-only secrets appear in client bundle
 * This script checks the .next output for any server-only environment variables
 */

const fs = require('fs');
const path = require('path');

// Server-only environment variables that should never appear in client bundle
const SERVER_ONLY_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_BASIC',
  'STRIPE_PRICE_PRO',
  'SENTRY_DSN',
];

// Directories to check in .next output
const CLIENT_DIRS = [
  'static/chunks',
  'static/css',
  'server/app',
];

function checkFileForSecrets(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const foundSecrets = [];
    
    SERVER_ONLY_VARS.forEach(secret => {
      if (content.includes(secret)) {
        foundSecrets.push(secret);
      }
    });
    
    return foundSecrets;
  } catch (error) {
    // File doesn't exist or can't be read, skip
    return [];
  }
}

function checkDirectoryForSecrets(dirPath) {
  const foundSecrets = [];
  
  try {
    const files = fs.readdirSync(dirPath, { recursive: true });
    
    files.forEach(file => {
      if (typeof file === 'string' && (file.endsWith('.js') || file.endsWith('.css'))) {
        const fullPath = path.join(dirPath, file);
        const secrets = checkFileForSecrets(fullPath);
        if (secrets.length > 0) {
          foundSecrets.push({
            file: fullPath,
            secrets: secrets
          });
        }
      }
    });
  } catch (error) {
    // Directory doesn't exist, skip
  }
  
  return foundSecrets;
}

function main() {
  console.log('🔍 Checking for server-only secrets in client bundle...');
  
  const nextDir = path.join(__dirname, '..', '.next');
  const foundIssues = [];
  
  // Check each client directory
  CLIENT_DIRS.forEach(dir => {
    const dirPath = path.join(nextDir, dir);
    const issues = checkDirectoryForSecrets(dirPath);
    foundIssues.push(...issues);
  });
  
  if (foundIssues.length > 0) {
    console.error('❌ SECURITY ISSUE: Server-only secrets found in client bundle!');
    console.error('');
    
    foundIssues.forEach(issue => {
      console.error(`File: ${issue.file}`);
      console.error(`Secrets found: ${issue.secrets.join(', ')}`);
      console.error('');
    });
    
    console.error('🚨 This is a security vulnerability!');
    console.error('Server-only environment variables must not be exposed to the client.');
    console.error('Check your environment variable usage in client-side code.');
    
    process.exit(1);
  }
  
  console.log('✅ No server-only secrets found in client bundle');
  console.log('🔒 Client bundle is secure');
}

if (require.main === module) {
  main();
}

module.exports = { checkFileForSecrets, checkDirectoryForSecrets };
