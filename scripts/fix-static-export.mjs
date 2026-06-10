import { readFileSync, writeFileSync } from 'fs'
import { globSync } from 'glob'
import path from 'path'

const ROOT = '/work/apps/sim/app'
const patterns = [
  '**/route.ts',
  '**/opengraph-image.tsx',
  '**/icon.tsx',
  '**/sitemap.ts',
  '**/robots.ts',
  '**/sitemap.xml/route.ts',
  '**/robots.txt/route.ts',
]

const files = [...new Set(patterns.flatMap(p => globSync(p, { cwd: ROOT, absolute: true })))]
files.sort()

const modified = []

for (const file of files) {
  // skip .test.ts
  if (file.endsWith('.test.ts')) continue

  const content = readFileSync(file, 'utf-8')
  
  // Check if it already has force-static
  if (/export\s+const\s+dynamic\s*=\s*['"]force-static['"]/.test(content)) {
    continue
  }

  // Determine if this is a route file with edge runtime or async exports
  const hasEdgeRuntime = /export\s+const\s+runtime\s*=\s*['"]edge['"]/.test(content)
  const hasAsyncExport = /export\s+(default\s+async\s+function|const\s+(GET|POST|PUT|DELETE|PATCH)\s*=)/.test(content)

  if (!hasEdgeRuntime && !hasAsyncExport) {
    continue
  }

  // If it already has force-dynamic, replace it with force-static
  // Otherwise, add it at the top of the exports section
  let newContent
  if (/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/.test(content)) {
    newContent = content.replace(
      /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/,
      `export const dynamic = 'force-static'`
    )
  } else {
    // Add after imports, before other exports
    // Find the first export statement
    const firstExportMatch = content.match(/^export\s+/m)
    if (firstExportMatch) {
      const idx = firstExportMatch.index
      newContent = content.slice(0, idx) + `export const dynamic = 'force-static'\n\n` + content.slice(idx)
    } else {
      newContent = content + `\nexport const dynamic = 'force-static'\n`
    }
  }

  writeFileSync(file, newContent, 'utf-8')
  modified.push(path.relative('/work/apps/sim', file))
}

console.log('Modified files:')
for (const f of modified) {
  console.log(f)
}
console.log(`\nTotal modified: ${modified.length}`)
