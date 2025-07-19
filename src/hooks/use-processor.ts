import { useCallback, useMemo, useState } from "react"
import { createStyleGuideProcessor } from "../lib/processor.js"
import type { FileGroup, Language, Processor, ProcessorOptions, QueuedTask, Worker } from "../lib/types.js"

type UseProcessorOptions = ProcessorOptions & {
  fileGroups?: Map<Language, FileGroup[]>
  outputDir: string
}

type UseProcessorResult = {
  // State
  processor: Processor
  workers: Worker[]
  queuedTasks: QueuedTask[]
  progress: number
  results: Map<Language, string> | null
  error: string | null
  isRunning: boolean

  // Methods
  run: () => void // Returns void for useEffect compatibility
  reset: () => void
}

export const useProcessor = (options: UseProcessorOptions): UseProcessorResult => {
  const { model, concurrency, inputDir, onWorkerUpdate, fileGroups, outputDir } = options

  // State
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<Map<Language, string> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [queuedTasks, setQueuedTasks] = useState<QueuedTask[]>([])

  // Create processor instance
  const processor = useMemo(
    () =>
      createStyleGuideProcessor({
        model,
        concurrency,
        inputDir,
        database: options.database,
        onWorkerUpdate: (updatedWorker: Worker) => {
          setWorkers(previousWorkers => previousWorkers.map(w => (w.id === updatedWorker.id ? updatedWorker : w)))
          onWorkerUpdate?.(updatedWorker)
        },
        onProgress: setProgress,
        onQueueUpdate: setQueuedTasks,
      }),
    [model, concurrency, inputDir, onWorkerUpdate, options.database],
  )
  const [workers, setWorkers] = useState<Worker[]>(processor.workers)

  // Run method
  const run = useCallback(async () => {
    // Validate required options for running
    if (!fileGroups || !inputDir || !outputDir) {
      setError("Missing required options: fileGroups, inputDir, or outputDir")
      return
    }

    // Reset state
    setError(null)
    setResults(null)
    setIsRunning(true)

    try {
      const styleGuides = await processor.run({ fileGroups, inputDir, outputDir })
      setResults(styleGuides)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsRunning(false)
    }
  }, [processor, fileGroups, inputDir, outputDir])

  // Reset method
  const reset = useCallback(() => {
    processor.reset()
    setProgress(0)
    setResults(null)
    setError(null)
    setIsRunning(false)
    setQueuedTasks([])
  }, [processor])

  return {
    workers,
    queuedTasks,
    processor,
    progress,
    results,
    error,
    isRunning,
    run,
    reset,
  }
}
