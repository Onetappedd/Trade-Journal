#!/usr/bin/env node

/**
 * Fix createClient import issues in API routes
 */

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'app', 'api');

function fixCreateClientInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix direct createClient usage
    if (content.includes('createClient(') && !content.includes('createSupabaseWithToken')) {
      // Add import if not present
      if (!content.includes('createSupabaseWithToken')) {
        content = content.replace(
          /import { NextRequest, NextResponse } from 'next\/server'/,
          "import { NextRequest, NextResponse } from 'next/server'\nimport { createSupabaseWithToken } from '@/lib/supabase/server'"
        );
      }

      // Replace createClient usage
      content = content.replace(
        /const supabase = createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\s*process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!,\s*\{[^}]*\}\s*\)/gs,
        'const supabase = createSupabaseWithToken(request)'
      );

      // Remove token extraction if present
      content = content.replace(
        /const token = authHeader\.(split|replace)\([^)]+\);\s*\n\s*/g,
        ''
      );

      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (file.endsWith('.ts') && file.includes('route')) {
      fixCreateClientInFile(filePath);
    }
  }
}

console.log('Fixing createClient issues in API routes...');
walkDirectory(apiDir);
console.log('Done!');
