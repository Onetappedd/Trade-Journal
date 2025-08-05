const fs = require('fs');
const path = require('path');

const dashboardDir = './app/dashboard';
const dynamicExport = '// Force dynamic rendering to avoid static generation issues\nexport const dynamic = \'force-dynamic\'\n\n';

function addDynamicExport(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has dynamic export
    if (content.includes('export const dynamic')) {
      console.log(`Skipping ${filePath} - already has dynamic export`);
      return;
    }
    
    // Add dynamic export after imports but before default export
    if (content.includes('"use client"')) {
      // For client components, add after "use client"
      content = content.replace('"use client"', `"use client"\n\n${dynamicExport}`);
    } else {
      // For server components, add at the beginning
      content = `${dynamicExport}${content}`;
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Added dynamic export to ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item === 'page.tsx') {
      addDynamicExport(fullPath);
    }
  }
}

console.log('Adding dynamic exports to dashboard pages...');
processDirectory(dashboardDir);
console.log('Done!');