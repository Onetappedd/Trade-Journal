#!/usr/bin/env node

/**
 * Script to update all Supabase imports to use standardized wrappers
 * This script finds and replaces direct createClient imports with our centralized wrappers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to find and replace
const replacements = [
  // Server-side API routes
  {
    pattern: /import { createClient } from '@supabase\/supabase-js';/g,
    replacement: "import { createSupabaseWithToken } from '@/lib/supabase/server';",
    test: (filePath) => filePath.includes('/app/api/') || filePath.includes('/src/app/api/')
  },
  // Client-side components
  {
    pattern: /import { createClient } from '@supabase\/supabase-js';/g,
    replacement: "import { createSupabaseClient } from '@/lib/supabase/client';",
    test: (filePath) => !filePath.includes('/app/api/') && !filePath.includes('/src/app/api/') && !filePath.includes('/scripts/')
  },
  // Replace createClient() calls with createSupabaseClient() in client code
  {
    pattern: /const supabase = createClient\(\);/g,
    replacement: "const supabase = createSupabaseClient();",
    test: (filePath) => !filePath.includes('/app/api/') && !filePath.includes('/src/app/api/')
  },
  // Replace createClient() calls with createSupabaseWithToken(token) in server code
  {
    pattern: /const supabase = createClient\(/g,
    replacement: "const supabase = createSupabaseWithToken(token);",
    test: (filePath) => filePath.includes('/app/api/') || filePath.includes('/src/app/api/')
  }
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply replacements based on file type
    replacements.forEach(({ pattern, replacement, test }) => {
      if (test(filePath) && pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });
    
    // Remove old createClient instantiations with process.env
    const oldPattern = /const supabase = createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\s*process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!,\s*\{[^}]*\}\s*\);/gs;
    if (oldPattern.test(content)) {
      content = content.replace(oldPattern, 'const supabase = createSupabaseWithToken(token);');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...findFiles(fullPath, extensions));
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return files;
}

function main() {
  console.log('🔍 Finding files with Supabase imports...');
  
  const files = findFiles('.');
  let updatedCount = 0;
  
  files.forEach(file => {
    if (updateFile(file)) {
      updatedCount++;
    }
  });
  
  console.log(`\n🎉 Updated ${updatedCount} files`);
  console.log('\n📋 Summary:');
  console.log('- Server-side API routes now use createSupabaseWithToken()');
  console.log('- Client-side components now use createSupabaseClient()');
  console.log('- All imports now use centralized wrappers');
}

if (require.main === module) {
  main();
}

module.exports = { updateFile, findFiles };
