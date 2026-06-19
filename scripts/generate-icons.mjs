// Rasterizes assets/icon.svg into the PNG sizes the PWA manifest references.
// Run with: pnpm icons
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = await readFile(join(root, 'assets', 'icon.svg'))
const outDir = join(root, 'public')
await mkdir(outDir, { recursive: true })

const targets = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'maskable-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(join(outDir, name))
  console.log(`wrote public/${name}`)
}

// Keep a crisp SVG favicon too.
await writeFile(join(outDir, 'favicon.svg'), svg)
console.log('wrote public/favicon.svg')
