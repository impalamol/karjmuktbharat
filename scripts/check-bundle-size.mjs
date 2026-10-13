// Performance budget check, run after `vite build`.
//  - Initial load (entry chunk + everything it statically imports + CSS) must stay under 300 kB gzipped.
//  - Each lazy route must stay under 150 kB gzipped on top of the initial load.
// Prints the full total for visibility.
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const DIST = new URL('../dist/', import.meta.url).pathname
const manifest = JSON.parse(readFileSync(join(DIST, '.vite/manifest.json'), 'utf8'))
const gz = (file) => gzipSync(readFileSync(join(DIST, file)), { level: 9 }).length
const kb = (n) => `${(n / 1024).toFixed(1)} kB`

function closure(key, seen = new Set()) {
  if (seen.has(key)) return seen
  seen.add(key)
  for (const imp of manifest[key]?.imports ?? []) closure(imp, seen)
  return seen
}
const files = (keys) => {
  const out = new Set()
  for (const k of keys) {
    const c = manifest[k]
    if (!c) continue
    out.add(c.file)
    for (const css of c.css ?? []) out.add(css)
  }
  return out
}
const size = (set) => [...set].reduce((a, f) => a + gz(f), 0)

const entryKey = Object.keys(manifest).find((k) => manifest[k].isEntry)
const initialKeys = closure(entryKey)
const initialFiles = files(initialKeys)
const initial = size(initialFiles)

let failed = false
console.log(`Initial load: ${kb(initial)} gz (budget 300 kB)`)
if (initial > 300 * 1024) failed = true

for (const [key, chunk] of Object.entries(manifest)) {
  if (!chunk.isDynamicEntry || !/src\/pages\//.test(key)) continue
  const extra = [...files(closure(key))].filter((f) => !initialFiles.has(f))
  const s = extra.reduce((a, f) => a + gz(f), 0)
  const over = s > 150 * 1024
  if (over) failed = true
  console.log(`  ${over ? '✗' : '✓'} ${key.replace('src/pages/', '').padEnd(16)} +${kb(s)}`)
}

const all = new Set(Object.values(manifest).flatMap((c) => [c.file, ...(c.css ?? [])]))
console.log(`All chunks (incl. lazy charts): ${kb(size(all))} gz`)
if (failed) {
  console.error('Performance budget exceeded')
  process.exit(1)
}
