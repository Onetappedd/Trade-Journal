// scripts/find-token.js
const fs = require('fs').promises;
const path = require('path');

async function scanDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await scanDir(fullPath);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const content = await fs.readFile(fullPath, 'utf8');
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (/\btoken\b/.test(line)) {
          console.log(
            `${path.relative(process.cwd(), fullPath)}:${idx + 1}  ${line.trim()}`
          );
        }
      });
    }
  }
}

(async () => {
  try {
    // Change this if you want to scan more folders under frontend
    const targetDir = path.join(process.cwd(), 'frontend', 'app');
    await scanDir(targetDir);
    console.log('✅ Scan complete.');
  } catch (err) {
    console.error('Error scanning for token:', err);
    process.exit(1);
  }
})();
