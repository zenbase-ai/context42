#!/usr/bin/env node
import { resolve } from "node:path"
import { render } from "ink"
import meow from "meow"
import { TUI } from "./tui"

const cli = meow(
  `
	Usage
	  $ context42 [options]

	Options
	  -i, --input       Input directory to analyze (default: current directory)
	  -o, --output      Output directory for style guides (default: ./context42)
	  -m, --model       Gemini model to use (default: gemini-2.5-pro)
	  -c, --concurrency Number of concurrent operations (default: 4)
	  -h, --help        Show help

	Examples
	  $ context42
	  $ context42 -i src/
	  $ context42 -o .cursor/rules/
	  $ context42 -m gemini-2.0-flash-exp
	  $ context42 -c 10
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
    },
  },
)

// Check for GEMINI_API_KEY
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is not set.")
  console.error("Please set it before running context42:")
  console.error('  export GEMINI_API_KEY="your-api-key"')
  process.exit(1)
}

render(<TUI inputDir={resolve(cli.flags.input)} outputDir={resolve(cli.flags.output)} model={cli.flags.model} />)
