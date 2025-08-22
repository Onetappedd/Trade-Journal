import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const EXT_WHITELIST = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);
const UNICODE_RE = /[\uFEFF\u200B-\u200D\u00A0\u2028\u2029\u201C\u201D\u2018\u2019]/g;

function replaceUnicodeSmartQuotes(str) {
  return str
    .replace(/[\u201C\u201D]/g, '"') // “ ”
    .replace(/[\u2018\u2019]/g, "'") // ‘ ’
    .replace(/[\uFEFF\u200B-\u200D\u00A0\u2028\u2029]/g, ' ');
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

for (const path of walk('frontend')) {
  let content = readFileSync(path, 'utf-8');
  const cleaned = replaceUnicodeSmartQuotes(content);
  if (content !== cleaned) {
    writeFileSync(path, cleaned, 'utf-8');
    console.log(`[fix-hidden-unicode] Cleaned ${path}`);
  }
}
