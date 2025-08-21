import { createReadStream, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import readline from 'node:readline';

// Suspicious unicode regex
const WEIRD_REGEX = /[\u200B-\u200D\uFEFF\u00A0\u201C\u201D\u2018\u2019\u2026]/g;
const ROOT = process.cwd();
const GLOB_DIR = 'frontend/app/api/';
const EXT_WHITELIST = new Set(['.ts', '.tsx']);

let found = false;

function checkFile(path) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: createReadStream(path, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });
    let lineNum = 1;
    rl.on('line', (line) => {
      const match = line.match(WEIRD_REGEX);
      if (match) {
        found = true;
        console.error(`[FAIL] ${path}:${lineNum} contains weird/suspicious Unicode chars:`, match.join(' '));
      }
      lineNum++;
    });
    rl.on('close', resolve);
  });
}

function* walk(dir) {
  const files = readdirSync(dir);
  for (const file of files) {
    const full = join(dir, file);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      yield* walk(full);
    } else if (EXT_WHITELIST.has(extname(full))) {
      yield full;
    }
  }
}

(async () => {
  const rootDir = join(ROOT, GLOB_DIR);
  for (const file of walk(rootDir)) {
    // check utf-8 encoding is default/no BOM by streaming lines
    await checkFile(file);
  }
  if (found) {
    process.exit(1);
  } else {
    console.log('[OK] No suspicious Unicode chars in app/api routes');
  }
})();
