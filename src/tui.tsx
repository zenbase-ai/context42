import { mkdir, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { Box, Text, useApp } from "ink"
import { useEffect, useMemo, useState } from "react"
import { ExplorerStatus } from "./components/ExplorerStatus"
import { ProgressBar } from "./components/ProgressBar"
import { WorkerStatus } from "./components/WorkerStatus"
import { closeDatabase } from "./lib/database"
import { discoverFiles } from "./lib/explorer"
import { createStyleGuideProcessor } from "./lib/processor"
import type { CLIPhase } from "./lib/types"

type TUIProps = {
  inputDir: string
  outputDir: string
  model: string
}

export const TUI: React.FC<TUIProps> = ({ inputDir = ".", outputDir = "./context42", model = "gemini-2.5-pro" }) => {
  const { exit } = useApp()
  const [error, setError] = useState<string | null>(null)

  const groups = useMemo(() => discoverFiles({ directory: inputDir }), [inputDir])
  const [completed, setCompleted] = useState(0)
  const [results, setResults] = useState<Map<string, string>>(() => new Map())

  const phase = useMemo<CLIPhase>(() => {
    if (error) return "error"
    if (completed === groups.length) return "complete"
    if (completed >= 0) return "process"
    return "explore"
  }, [error, completed, groups.length])

  const processor = useMemo(
    () =>
      createStyleGuideProcessor({
        concurrency: Math.min(8, groups.length),
        onProgress: current => setCompleted(current),
        rootPath: resolve(inputDir),
        model,
      }),
    [groups.length, inputDir, model],
  )

  useEffect(() => {
    const run = async () => {
      try {
        const styleGuides = await processor.run(groups, inputDir)
        setResults(styleGuides)

        await mkdir(outputDir, { recursive: true })
        for (const [language, content] of styleGuides) {
          const filename = join(outputDir, `${language}.md`)
          await writeFile(filename, content, "utf-8")
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "An unknown error occurred")
      } finally {
        closeDatabase()
        setTimeout(exit, 2000)
      }
    }

    run()
  }, [processor, exit, groups, inputDir, outputDir])

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Explorer Status */}
      <ExplorerStatus fileGroups={groups} isLoading={phase === "explore"} />

      {/* Worker Status */}
      {phase === "process" && <WorkerStatus workers={processor.workers} />}

      {/* Progress Bar */}
      {phase === "process" && (
        <Box marginTop={1}>
          <ProgressBar value={completed} max={groups.length} />
        </Box>
      )}

      {/* Completion Message */}
      {phase === "complete" && (
        <Box marginTop={1}>
          <Text color="green">✓ Style guides generated successfully!</Text>
          <Box flexDirection="column" marginTop={1}>
            {Array.from(results.keys()).map(lang => (
              <Text key={lang} dimColor>
                → {outputDir}/{lang}.md
              </Text>
            ))}
          </Box>
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Box marginTop={1}>
          <Text color="red">✗ Error: {error}</Text>
        </Box>
      )}
    </Box>
  )
}
