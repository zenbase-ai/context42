#!/usr/bin/env node
import { homedir } from "node:os"
import { join, resolve } from "node:path"
import { cancel, intro, isCancel, multiselect, outro, spinner, text } from "@clack/prompts"
import { sum } from "es-toolkit"
import meow from "meow"
import { cleanupRegistry } from "./lib/cleanup-registry.js"
import { DB } from "./lib/database.js"
import { explorer } from "./lib/explorer.js"
import type { FileGroup, Language } from "./lib/types.js"

const entrypoint = meow(
  `
	Usage
	  $ context42 [options]

	Options
	  -i, --input       Input directory to analyze (default: current directory)
	  -o, --output      Output directory for style guides (default: ./context42)
	  -m, --model       Gemini model to use (default: gemini-2.5-pro)
	  -c, --concurrency Number of concurrent operations (default: 4)
	  -r, --run         Resume from a previous run ID
	  -d, --debug       Debug mode - shows run ID on error and preserves it
	  -h, --help        Show help

	Examples
	  $ context42
	  $ context42 -i src/
	  $ context42 -o .cursor/rules/
	  $ context42 -m gemini-2.0-flash-exp
	  $ context42 -c 10
	  $ context42 --run abc123-def456
	  $ context42 --debug
	  $ GEMINI_API_KEY="your-key" context42

	Note: Requires GEMINI_API_KEY environment variable to be set.
`,
  {
    importMeta: import.meta,
    flags: {
      input: {
        type: "string",
        shortFlag: "i",
        default: ".",
      },
      output: {
        type: "string",
        shortFlag: "o",
        default: "./context42/",
      },
      model: {
        type: "string",
        shortFlag: "m",
        default: "gemini-2.5-flash",
      },
      concurrency: {
        type: "number",
        shortFlag: "c",
        default: 4,
      },
      run: {
        type: "string",
        shortFlag: "r",
      },
      debug: {
        type: "boolean",
        shortFlag: "d",
        default: false,
      },
    },
  },
)

export interface CLIResult {
  fileGroups: Map<Language, FileGroup[]>
  inputDir: string
  outputDir: string
  model: string
  concurrency: number
  total: number
  database: DB
  debug: boolean
}

export const cli = async (): Promise<CLIResult | null> => {
  if (!process.env.GEMINI_API_KEY) {
    cancel("Error: GEMINI_API_KEY environment variable is not set.")
    process.exit(1)
  }

  intro("\x1b[1mThe best code style guide is the one your team already follows.\x1b[0m This tool discovers it.")
  const s = spinner({ indicator: "timer" })
  s.start("Exploring subdirectories...")
  const allFileGroups = await explorer({ directory: resolve(entrypoint.flags.input) })
  const allFileCount = sum(
    Array.from(allFileGroups.values()).map(groups => sum(groups.map(group => group.files.length))),
  )
  s.stop(`Found ${allFileCount} files`)

  const languages = await multiselect({
    message: "What shall I ponder?",
    options: Array.from(allFileGroups.keys())
      .map(ext => ({ label: `**/*.${ext}`, value: ext as string }))
      .toSorted((a, b) => a.value.localeCompare(b.value)),
  })

  if (isCancel(languages)) {
    cancel("No languages selected")
    return null
  }

  let selectedFileCount = 0
  // Filter to only selected languages
  const selectedFileGroups = new Map<Language, FileGroup[]>()
  for (const lang of languages) {
    const groups = allFileGroups.get(lang as Language)
    if (groups) {
      selectedFileGroups.set(lang as Language, groups)
      selectedFileCount += sum(groups.map(group => group.files.length))
    }
  }

  // Initialize database
  const database = new DB(join(homedir(), ".context42", "data.db"), entrypoint.flags.run)
  outro(`Beginning run ${database.runId}...`)

  // Set up signal handlers for proper cleanup
  const cleanup = async () => {
    await cleanupRegistry.cleanup()
    database.close()
    process.exit(0)
  }

  process.on("SIGINT", cleanup)
  process.on("SIGTERM", cleanup)

  return {
    fileGroups: selectedFileGroups,
    inputDir: resolve(entrypoint.flags.input),
    outputDir: resolve(entrypoint.flags.output),
    model: entrypoint.flags.model,
    concurrency: Math.min(entrypoint.flags.concurrency, selectedFileCount),
    total: selectedFileCount,
    database,
    debug: entrypoint.flags.debug,
  }
}
