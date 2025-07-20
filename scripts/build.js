#!/usr/bin/env node
import * as esbuild from 'esbuild'
import { globby } from 'globby'
import * as fs from "node:fs/promises"
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import packageJSON from "../package.json" with { type: "json" }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

// Read package.json to get dependencies
const dependencies = Object.keys(packageJSON.dependencies || {})
const peerDependencies = Object.keys(packageJSON.peerDependencies || {})

// All external dependencies (don't bundle these)
const external = [...dependencies, ...peerDependencies, 'node:*']

// Dynamically find all source files
const entryPoints = await globby('src/**/*.{js,jsx,ts,tsx,mjs,cjs}', {
  cwd: projectRoot,
  absolute: false
})

async function build() {
  try {
    console.log('🔨 Building with esbuild...')
    console.log(`📁 Found ${entryPoints.length} source files`)

    await esbuild.build({
      entryPoints: entryPoints.map(entry => path.join(projectRoot, entry)),
      bundle: false, // Don't bundle, just transpile
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outdir: path.join(projectRoot, 'dist'),
      outbase: path.join(projectRoot, 'src'),
      jsx: 'automatic',
      sourcemap: true,
      treeShaking: true,
      minify: false,
      logLevel: 'info',
    })

    const indexPath = path.join(projectRoot, 'dist/main.js')
    const indexContent = await fs.readFile(indexPath, 'utf-8')
    if (!indexContent.startsWith('#!/usr/bin/env node')) {
      await fs.writeFile(indexPath, `#!/usr/bin/env node\n${indexContent}`)
    }

    await fs.chmod(indexPath, 0o755)

    console.log('✅ Build complete!')
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

build()
