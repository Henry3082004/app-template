// Fails when code uses a CSS class that no stylesheet defines (a class with no rule silently does nothing).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f)
  return statSync(p).isDirectory() ? walk(p) : [p]
})
const files = walk('src')
const defined = new Set()
for (const f of files.filter((f) => f.endsWith('.css'))) {
  const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) defined.add(m[1])
}
const used = new Map()
for (const f of files.filter((f) => /\.tsx?$/.test(f))) {
  const src = readFileSync(f, 'utf8')
  // every string literal inside className={...} or className="..."
  for (const m of src.matchAll(/className=(?:"([^"]*)"|\{([^}]*)\})/g)) {
    // drop operands of comparisons such as role === 'seeker' — those strings are not class names
    const chunk = (m[1] ?? m[2]).replace(/(?:[!=]==?)\s*(['"`])[^'"`]*\1|(['"`])[^'"`]*\2\s*(?:[!=]==?)/g, '')
    const strings = m[1] != null ? [m[1]] : [...chunk.matchAll(/'([^']*)'|`([^`]*)`|"([^"]*)"/g)].map((x) => x[1] ?? x[2] ?? x[3])
    for (const s of strings) for (const c of s.replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).filter(Boolean)) {
      if (!used.has(c)) used.set(c, f)
    }
  }
}
const missing = [...used].filter(([c]) => !defined.has(c))
if (missing.length) {
  console.error('CSS classes used but not defined:')
  for (const [c, f] of missing) console.error(`  .${c}  (${f})`)
  process.exit(1)
}
console.log(`css ok: ${used.size} classes used, all defined`)
