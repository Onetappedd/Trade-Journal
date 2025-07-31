const glob = require('glob')
const fs = require('fs').promises
const path = require('path')

const rootDir = path.join(__dirname, '..', 'frontend')
const exts = ['ts', 'tsx', 'js', 'jsx']
const pattern = `${rootDir}/**/*.{${exts.join(',')}}`

glob(pattern, async (err, files) => {
  if (err) {
    console.error('Glob error:', err)
    process.exit(1)
  }
  let found = false
  for (const file of files) {
    let lines
    try {
      const content = await fs.readFile(file, 'utf8')
      lines = content.split('\n')
    } catch (e) {
      console.error(`Error reading ${file}:`, e)
      continue
    }
    lines.forEach((line, idx) => {
      if (/\btoken\b/.test(line)) {
        found = true
        const relPath = path.relative(process.cwd(), file)
        console.log(`${relPath}:${idx + 1}  ${line}`)
      }
    })
  }
  if (!found) {
    console.log('✅ No token references found.')
  }
})
