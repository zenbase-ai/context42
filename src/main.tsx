#!/usr/bin/env node
import { render } from "ink"
import { cli } from "./cli.js"
import { Index } from "./index.js"

const result = await cli()

if (!result) {
  process.exit(0)
}

render(
  <Index
    fileGroups={result.fileGroups}
    inputDir={result.inputDir}
    outputDir={result.outputDir}
    model={result.model}
    concurrency={result.concurrency}
    total={result.total}
    database={result.database}
    debug={result.debug}
  />,
)
