import pLimit from "p-limit"
import { saveGeminiResponse, saveStyleGuide } from "./database.ts"
import { generateStyleGuide } from "./generator.ts"
import type { FileGroup, ProcessorOptions, StyleGuideProcessor, Worker, WorkerUpdate } from "./types.ts"

export const createStyleGuideProcessor = (options: ProcessorOptions): StyleGuideProcessor => {
  const concurrency = options.concurrency || 8
  const limit = pLimit(concurrency)

  // State managed via closure
  const workers: Worker[] = Array.from({ length: concurrency }, (_, index) => ({
    id: index + 1,
    status: "idle",
  }))

  let completed = 0

  const getAvailableWorker = (): number => {
    const worker = workers.find(w => w.status === "idle" || w.status === "success" || w.status === "error")
    return worker ? worker.id : -1
  }

  const updateWorker = (id: number, updates: Partial<WorkerUpdate>): void => {
    const worker = workers.find(w => w.id === id)
    if (worker == null) {
      throw new Error(`Worker with id ${id} not found`)
    }

    Object.assign(worker, updates)
    options.onWorkerUpdate?.(worker)
  }

  const run = async (fileGroups: FileGroup[], baseDirectory: string): Promise<Map<string, string>> => {
    const results = new Map<string, string>()

    // Process each language group
    const tasks = fileGroups.map(group =>
      limit(async () => {
        const workerId = getAvailableWorker()
        if (workerId === -1) return // Should not happen with p-limit

        try {
          // Update worker status
          updateWorker(workerId, {
            status: "working",
            language: group.language,
            directory: baseDirectory,
          })

          // Generate style guide
          const styleGuide = await generateStyleGuide({
            model: options.model,
            files: [...group.files], // Convert readonly array to mutable
            language: group.language,
          })

          // Save to database
          saveStyleGuide(group.language, styleGuide, baseDirectory)
          saveGeminiResponse(`Generate style guide for ${group.language} in ${baseDirectory}`, styleGuide)

          // Store result
          results.set(group.language, styleGuide)

          // Update progress
          completed++
          options.onProgress?.(completed)

          // Update worker status
          updateWorker(workerId, {
            status: "success",
            language: group.language,
            directory: baseDirectory,
          })
        } catch (error) {
          // Update worker status with error
          updateWorker(workerId, {
            status: "error",
            language: group.language,
            directory: baseDirectory,
            error: error instanceof Error ? error.message : "Unknown error",
          })

          // Still count as completed for progress
          completed++
          options.onProgress?.(completed)
        }
      }),
    )

    await Promise.all(tasks)
    return results
  }

  const reset = (): void => {
    completed = 0
    for (const worker of workers) {
      worker.status = "idle"
      worker.directory = undefined
      worker.language = undefined
      worker.error = undefined
      options.onWorkerUpdate?.(worker)
    }
  }

  return { run, reset, workers }
}
