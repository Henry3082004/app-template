// After `vite build`: declare the built assets (Zalo requires listCSS / listSyncJS / listAsyncJS) in
// both www/app-config.json and ./app-config.json (zmp deploy of an "existing project" reads the latter).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = import.meta.dirname
const www = join(dir, 'www')
const html = readFileSync(join(www, 'index.html'), 'utf8')
const entry = html.match(/src="\.?\/?(assets\/[^"]+\.js)"/)?.[1]
const files = readdirSync(join(www, 'assets'))
const lists = {
  listCSS: files.filter((f) => f.endsWith('.css')).map((f) => `assets/${f}`),
  listSyncJS: entry ? [entry] : [],
  listAsyncJS: files.filter((f) => f.endsWith('.js') && `assets/${f}` !== entry).map((f) => `assets/${f}`),
}
for (const p of [join(www, 'app-config.json'), join(dir, 'app-config.json')]) {
  const cfg = JSON.parse(readFileSync(p, 'utf8'))
  writeFileSync(p, JSON.stringify({ ...cfg, ...lists }, null, 2) + '\n')
}
console.log('app-config.json ->', JSON.stringify(lists))
