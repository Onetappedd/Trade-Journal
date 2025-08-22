import { createReadStream, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import readline from 'node:readline';

// Suspicious/unwanted unicode chars
const WEIRD_REGEX = /[\u200B-\u200D\uFEFF\u00A0\u201C\u201D\u2018\u2019\u2026]/g; // zero-widths, nbsp, curly quotes, ellipsis
const ROOT = process.cwd();
const SEARCH_DIR = 'frontend/app/api/';
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
        const caret = ' '.repeat(line.search(WEIRD_REGEX)) + '^';
        console.error(`[FAIL] ${path}:${lineNum}\n${line}\n${caret}`);
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
  const dir = join(ROOT, SEARCH_DIR);
  for (const file of walk(dir)) {
    await checkFile(file);
  }
  if (found) {
    process.exit(1);
  } else {
    console.log('[OK] No suspicious Unicode chars in app/api routes');
  }
})();
