import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const GLOBS = ['frontend']; // process all in frontend subdirs
const EXT_WHITELIST = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);
const UNICODE_RE = /[\uFEFF\u200B-\u200D\u00A0\u2028\u2029\u201C\u201D\u2018\u2019]/g;
const SMART_QUOTES_RE = /['‘’“”]/g;

function replaceSmartQuotes(str) {
  // Replace curly/smart quotes with ASCII straight equivalents
  return str
    .replace(/[\u201C\u201D]/g, '"') // “ ”
    .replace(/[\u2018\u2019]/g, "'") // ‘ ’
    .replace(/[\uFEFF\u200B-\u200D\u00A0\u2028\u2029]/g, ' '); // Invisible/unicode to space
}

function walk(dir) {
  let files = [];
  for (const file of readdirSync(dir)) {
    const full = join(dir, file);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files = files.concat(walk(full));
    } else if (EXT_WHITELIST.has(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

for (const dir of GLOBS) {
  for (const path of walk(dir)) {
    let content = readFileSync(path, 'utf-8');
    const cleaned = replaceSmartQuotes(content);
    if (content !== cleaned) {
      writeFileSync(path, cleaned, 'utf-8');
      console.log(`[fix-hidden-unicode] Cleaned ${path}`);
    }
  }
}
