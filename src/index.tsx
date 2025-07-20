import path from "node:path"
import { Box, Text, useApp } from "ink"
import BigText from "ink-big-text"
import Gradient from "ink-gradient"
import { useEffect, useMemo } from "react"
import { ExplorerStatus } from "./components/ExplorerStatus.js"
import { ProgressBar } from "./components/ProgressBar.js"
import Table from "./components/Table.js"
import { WorkersStatus } from "./components/WorkerStatus.js"
import { useProcessor } from "./hooks/use-processor.js"
import type { DB } from "./lib/database.js"
import type { FileGroup, Language } from "./lib/types.js"

const outputPath = (inputDir: string, outputDir: string, lang: Language) =>
  path.relative(inputDir, path.join(outputDir, `${lang}.md`))

export type IndexProps = {
  fileGroups: Map<Language, FileGroup[]>
  inputDir: string
  outputDir: string
  model: string
  concurrency: number
  total: number
  database: DB
  debug?: boolean
}

export const Index: React.FC<IndexProps> = ({
  fileGroups,
  inputDir,
  outputDir,
  model,
  concurrency,
  total,
  database,
  debug,
}) => {
  const { exit } = useApp()
  const { run, workers, queuedTasks, progress, results, error, reset } = useProcessor({
    model,
    concurrency,
    fileGroups,
    inputDir,
    outputDir,
    database,
  })

  useEffect(() => {
    run()
  }, [run])

  // Exit when complete or on error
  useEffect(() => {
    if (results != null || error != null) {
      // Reset processor before exiting
      database.close()
      reset()
      exit()
    }
  }, [results, error, exit, reset, database])

  const resultsViewModel = useMemo(
    () =>
      results == null
        ? []
        : Array.from(results.keys())
            .map(language => ({ language, path: outputPath(inputDir, outputDir, language) }))
            .toSorted((a, b) => a.language.localeCompare(b.language)),
    [results, inputDir, outputDir],
  )

  return (
    <Box flexDirection="column" paddingY={1}>
      <Gradient name="retro">
        <BigText text="context42" />
      </Gradient>

      {results != null ? (
        <>
          <Box marginTop={1}>
            <Text color="green">✓ Style guides generated successfully!</Text>
          </Box>
          <Table data={resultsViewModel} columnWidths={{ language: 16, path: 32 }} />
        </>
      ) : error != null ? (
        <>
          <ExplorerStatus fileGroups={fileGroups} isLoading={false} />
          <Box marginTop={1}>
            <Text color="red">✗ Error: {error}</Text>
            {debug && <Text dimColor>Run ID: {database.runId}</Text>}
          </Box>
        </>
      ) : (
        <>
          <ProgressBar value={progress} max={total} label="files" />
          <WorkersStatus workers={workers} inputDir={inputDir} queuedTasks={queuedTasks} />
        </>
      )}
    </Box>
  )
}
