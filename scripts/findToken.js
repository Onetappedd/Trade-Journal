const glob = require('glob')
const fs = require('fs')
const path = require('path')

const rootDir = path.join(__dirname, '..', 'frontend')
const exts = ['ts', 'tsx', 'js', 'jsx']
const pattern = `${rootDir}/**/*.{${exts.join(',')}}`

glob(pattern, (err, files) => {
  if (err) {
    console.error('Glob error:', err)
    process.exit(1)
  }
  let found = false
  files.forEach(file => {
    const relPath = path.relative(process.cwd(), file)
    const lines = fs.readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, idx) => {
      if (line.includes('token')) {
        found = true
        console.log(`${relPath}:${idx + 1}  ${line}`)
      }
    })
  })
  if (!found) {
    console.log('No token references found.')
  }
})
