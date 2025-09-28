#!/usr/bin/env node

/**
 * Comprehensive fix for all createClient import issues
 */

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'app', 'api');

function fixCreateClientInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if file has createClient usage
    if (content.includes('createClient(')) {
      console.log(`Fixing: ${filePath}`);
      
      // Add import if not present
      if (!content.includes('createSupabaseWithToken')) {
        // Find the first import line and add our import after it
        const importMatch = content.match(/import.*from.*['"]next\/server['"];?\s*\n/);
        if (importMatch) {
          content = content.replace(
            importMatch[0],
            importMatch[0] + "import { createSupabaseWithToken } from '@/lib/supabase/server';\n"
          );
        } else {
          // Add at the top if no Next.js import found
          content = "import { createSupabaseWithToken } from '@/lib/supabase/server';\n" + content;
        }
      }

      // Replace all createClient patterns
      const patterns = [
        // Pattern 1: Full createClient with environment variables
        /const supabase = createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\s*process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!,\s*\{[^}]*\}\s*\)/gs,
        // Pattern 2: createClient with token in headers
        /const supabase = createClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\s*process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!,\s*\{[^}]*global:[^}]*headers:[^}]*Authorization:[^}]*\}[^}]*\}\s*\)/gs,
        // Pattern 3: Simple createClient call
        /const supabase = createClient\([^)]*\)/g
      ];

      patterns.forEach(pattern => {
        if (pattern.test(content)) {
          content = content.replace(pattern, 'const supabase = createSupabaseWithToken(request)');
          modified = true;
        }
      });

      // Remove token extraction lines
      content = content.replace(
        /const token = authHeader\.(split|replace)\([^)]+\);\s*\n\s*/g,
        ''
      );

      // Remove unused token variables
      content = content.replace(
        /const token = [^;]+;\s*\n\s*/g,
        ''
      );

      if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (file.endsWith('.ts') && (file.includes('route') || file.includes('api'))) {
      fixCreateClientInFile(filePath);
    }
  }
}

console.log('🔧 Fixing all createClient issues...');
walkDirectory(apiDir);
console.log('✅ All createClient issues fixed!');
