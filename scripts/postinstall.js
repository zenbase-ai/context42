#!/usr/bin/env node
import { exec } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Check if we're in a temporary directory (npx/pnpm dlx scenario)
const cwd = process.cwd()
const isTemporary = cwd.includes('/dlx/') || cwd.includes('/npx/') || cwd.includes('/.npm/_npx/')

// Only run postinstall in temporary directories or if explicitly requested
if (!isTemporary && !process.env.FORCE_REBUILD) {
  process.exit(0)
}

const checkAndRebuildPackage = async (packageName) => {
  console.log(`🔧 Checking ${packageName} native bindings...`)

  try {
    // Try to load the package
    const packagePath = path.join(__dirname, '..', 'node_modules', packageName)

    if (!fs.existsSync(packagePath)) {
      console.log(`✅ ${packageName} not found, skipping rebuild`)
      return
    }

    // Test if the module loads correctly
    await import(packageName)
    console.log(`✅ ${packageName} native bindings are working correctly`)
  } catch (error) {
    console.log(`⚠️  ${packageName} native bindings need to be rebuilt`)
    console.log(`🔨 Rebuilding ${packageName}...`)

    try {
      // Try to rebuild the package
      await new Promise((resolve, reject) =>
        exec(`npm rebuild ${packageName}`, {
          stdio: 'inherit',
          cwd: path.join(__dirname, '..')
        }, (error, stdout, stderr) => {
          if (error) {
            reject(error)
          } else {
            resolve(stdout)
          }
        })
      )
      console.log(`✅ Successfully rebuilt ${packageName} native bindings`)
    } catch (rebuildError) {
      console.error(`❌ Failed to rebuild ${packageName}:`, rebuildError.message)
      console.error('You may need to install build tools:')
      console.error('- macOS: xcode-select --install')
      console.error('- Ubuntu/Debian: sudo apt-get install build-essential')
      console.error('- Windows: npm install --global windows-build-tools')
      // Don't fail the installation
    }
  }
}

// Check and rebuild packages
const packages = ['better-sqlite3', 'protobufjs']
for (const pkg of packages) {
  await checkAndRebuildPackage(pkg)
}
