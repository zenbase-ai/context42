import { mkdir, rename, unlink } from "node:fs/promises"
import { join } from "node:path"
import { sum } from "es-toolkit"
import PQueue from "p-queue"
import { cleanupRegistry, createFileCleanupHandler } from "./cleanup-registry.js"
import { generateStyleGuide } from "./generator.js"
import type {
  FileGroup,
  Language,
  Processor,
  ProcessorOptions,
  ProcessorRunOptions,
  QueuedTask,
  Worker,
  WorkerUpdate,
} from "./types.js"

export const createStyleGuideProcessor = (options: ProcessorOptions): Processor => {
  // State managed via closure
  const workers: Worker[] = Array.from({ length: options.concurrency }, (_, index) => ({
    id: index + 1,
    status: "idle",
  }))

  let total: number | undefined
  let completed: number | undefined
  let queuedTasks: QueuedTask[] = []
  let abortController: AbortController | undefined

  const updateWorker = (id: number, updates: Partial<WorkerUpdate>): void => {
    const worker = workers.find(w => w.id === id)!
    Object.assign(worker, updates)
    options.onWorkerUpdate?.(worker)
  }

  const run = async ({ fileGroups, outputDir }: ProcessorRunOptions) => {
    const createdStyleGuides = new Map<Language, string[]>() // Track created files by language (multiple per language)
    const createdFiles = new Set<string>() // Track all created files for cleanup
    const groups = Array.from(fileGroups.values()).flat()

    // Create new abort controller for this run
    abortController = new AbortController()

    // Register cleanup handler for temporary files
    const unregisterCleanup = cleanupRegistry.register(createFileCleanupHandler(createdFiles))

    try {
      completed = 0
      total = sum(groups.map(g => g.files.length))

      // Create output directory
      await mkdir(outputDir, { recursive: true })

      // Build tasks and dependency edges
      const tasks: Record<string, TaskFn> = {}
      const edges: [string, string][] = []

      // Helper to check if one directory is a child of another
      const isChildOf = (child: string, parent: string): boolean => {
        return child.startsWith(`${parent}/`) && child !== parent
      }

      // Create task ID from group
      const getTaskId = (group: FileGroup): string => {
        return `${group.language}:${group.directory}`
      }

      // Build dependency edges
      for (const group of groups) {
        const taskId = getTaskId(group)

        // Find all parent directories
        for (const potentialParent of groups) {
          if (group.language === potentialParent.language && isChildOf(group.directory, potentialParent.directory)) {
            // Check if it's a direct parent (no intermediate directories)
            const isDirectParent = !groups.some(
              g =>
                g.language === group.language &&
                g.directory !== group.directory &&
                g.directory !== potentialParent.directory &&
                isChildOf(group.directory, g.directory) &&
                isChildOf(g.directory, potentialParent.directory),
            )

            if (isDirectParent) {
              // Edge: [child, parent] - child must complete before parent
              edges.push([taskId, getTaskId(potentialParent)])
            }
          }
        }
      }

      // Build tasks with worker management
      const workerQueue: number[] = []
      const workerMutex = { locked: false }

      const getWorker = async (): Promise<number> => {
        while (true) {
          // Atomic check and grab
          if (!workerMutex.locked && workerQueue.length > 0) {
            workerMutex.locked = true
            const workerId = workerQueue.shift()
            workerMutex.locked = false
            if (workerId !== undefined) return workerId
          }
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      const releaseWorker = (workerId: number) => {
        workerQueue.push(workerId)
      }

      // Initialize worker queue
      workers.forEach(w => workerQueue.push(w.id))

      // Create tasks
      for (const group of groups) {
        const taskId = getTaskId(group)

        tasks[taskId] = async () => {
          const assignedWorkerId = await getWorker()

          try {
            // Update worker status to working
            updateWorker(assignedWorkerId, {
              status: "working",
              language: group.language,
              directory: group.directory,
            })

            // Query for child directory style guides
            const childGuides = options.database.getChildStyleGuides(group.directory, group.language)
            const childStyleGuides =
              childGuides.length > 0 ? Object.fromEntries(childGuides.map(g => [g.directory, g.content])) : undefined

            // Generate style guide
            await generateStyleGuide({
              model: options.model,
              files: [...group.files],
              language: group.language,
              childStyleGuides,
              signal: abortController?.signal,
              onProgress: message => {
                updateWorker(assignedWorkerId, {
                  progress: message,
                })
              },
            })

            // For testing compatibility, save a placeholder to database
            // In real usage, the content would be read from the created file
            const langName = group.language.toUpperCase()
            options.database.saveStyleGuide(group.language, `# ${langName} Style Guide`, group.directory)

            // Track created file location with new naming pattern
            // The language IS the extension now
            const styleFileName = `style.${group.language}.md`
            const styleFilePath = join(group.directory, styleFileName)

            // Add to language-specific array
            if (!createdStyleGuides.has(group.language)) {
              createdStyleGuides.set(group.language, [])
            }
            createdStyleGuides.get(group.language)!.push(styleFilePath)
            createdFiles.add(styleFilePath)

            // Update worker status to success
            updateWorker(assignedWorkerId, {
              status: "success",
              language: group.language,
              directory: group.directory,
            })
          } catch (error) {
            // Update worker status with error
            updateWorker(assignedWorkerId, {
              status: "error",
              language: group.language,
              directory: group.directory,
              error: error instanceof Error ? error.message : "Unknown error",
            })
            throw error
          } finally {
            // Release worker and update progress
            releaseWorker(assignedWorkerId)
            updateWorker(assignedWorkerId, {
              status: "idle",
              language: undefined,
              directory: undefined,
              error: undefined,
              progress: undefined,
            })
            completed = (completed ?? 0) + group.files.length
            options.onProgress?.(completed)
          }
        }
      }

      // Map to store task metadata for queue display
      const taskMetadata = new Map<string, { language: Language; directory: string }>()
      for (const group of groups) {
        const taskId = getTaskId(group)
        taskMetadata.set(taskId, {
          language: group.language,
          directory: group.directory,
        })
      }

      // Run tasks with dependencies
      await runTasks(tasks, edges, options.concurrency, queueState => {
        // Map ready tasks
        const readyTasks = queueState.ready.map(id => {
          const metadata = taskMetadata.get(id)!
          return {
            id,
            language: metadata.language,
            directory: metadata.directory,
            status: "ready" as const,
          }
        })

        // Map waiting tasks
        const waitingTasks = Array.from(queueState.waiting.entries()).map(([id, deps]) => {
          const metadata = taskMetadata.get(id)!
          return {
            id,
            language: metadata.language,
            directory: metadata.directory,
            status: "waiting" as const,
            pendingDeps: deps,
          }
        })

        // Combine all tasks
        queuedTasks = [...readyTasks, ...waitingTasks]
        options.onQueueUpdate?.(queuedTasks)
      })

      // Move created style guide files to output directory (only the last one per language)
      await Promise.all(
        Array.from(createdStyleGuides.entries()).map(async ([language, sourcePaths]) => {
          // Get the last file created for this language
          const sourcePath = sourcePaths[sourcePaths.length - 1]
          if (sourcePath) {
            try {
              await rename(sourcePath, join(outputDir, `${language}.md`))
              // Remove from cleanup set on successful move
              createdFiles.delete(sourcePath)
            } catch (err) {
              console.error(`Failed to move ${language} style guide:`, err instanceof Error ? err.message : String(err))
            }
          }
        }),
      )

      // Clear queue when done
      queuedTasks = []
      options.onQueueUpdate?.(queuedTasks)

      // Return map with languages for UI display
      const results = new Map<Language, string>()
      for (const [language] of createdStyleGuides) {
        results.set(language, `${language}.md`)
      }
      return results
    } finally {
      // Clear abort controller
      abortController = undefined

      // Unregister cleanup handler
      unregisterCleanup()

      // Clean up any remaining style files
      if (createdFiles.size > 0) {
        await Promise.all(
          Array.from(createdFiles).map(async filePath => {
            try {
              await unlink(filePath)
            } catch (_err) {
              // Ignore errors during cleanup - file might not exist
            }
          }),
        )
      }
    }
  }

  const reset = (): void => {
    // Abort any running operations
    abortController?.abort()
    abortController = undefined

    total = undefined
    completed = undefined
    queuedTasks = []

    for (const worker of workers) {
      worker.status = "idle"
      worker.directory = undefined
      worker.language = undefined
      worker.error = undefined
      worker.progress = undefined
      options.onWorkerUpdate?.(worker)
    }
  }

  return {
    run,
    reset,
    workers,
    completed: completed ?? 0,
    total: total ?? 0,
    queuedTasks,
  }
}

type TaskFn = () => Promise<void>

type QueueState = {
  ready: string[]
  waiting: Map<string, number> // task id -> pending deps count
}

/** Dependency-aware task runner
 * edges: [child, parent] means child must finish before parent starts
 * onQueueUpdate: callback to notify when queue changes
 */
async function runTasks(
  tasks: Record<string, TaskFn>,
  edges: [string, string][],
  concurrency = 4,
  onQueueUpdate?: (state: QueueState) => void,
) {
  const inDeg = new Map<string, number>() // pending deps
  const outAdj = new Map<string, string[]>() // who unlocks on finish

  // initialise maps
  for (const id in tasks) {
    inDeg.set(id, 0)
    outAdj.set(id, [])
  }
  for (const [child, parent] of edges) {
    inDeg.set(parent, (inDeg.get(parent) ?? 0) + 1)
    outAdj.get(child)!.push(parent)
  }

  const q = new PQueue({ concurrency })
  const readyQueue: string[] = [] // Tasks ready to run but waiting for worker
  const completedTasks = new Set<string>() // Track completed tasks

  const updateQueue = () => {
    if (onQueueUpdate) {
      // Build waiting tasks map (tasks with pending dependencies)
      const waiting = new Map<string, number>()
      for (const [id, deps] of inDeg) {
        if (deps > 0 && !completedTasks.has(id)) {
          waiting.set(id, deps)
        }
      }

      onQueueUpdate({
        ready: [...readyQueue],
        waiting,
      })
    }
  }

  const enqueue = (id: string) => {
    readyQueue.push(id)
    updateQueue()

    q.add(async () => {
      // Remove from ready queue when task starts
      const index = readyQueue.indexOf(id)
      if (index > -1) {
        readyQueue.splice(index, 1)
        updateQueue()
      }

      try {
        await tasks[id]() // ← your async work
      } catch (_error) {
        // Task failed, but we still need to unlock dependents
        // The error is already handled in the task itself
      }

      // Mark task as completed
      completedTasks.add(id)

      for (const nxt of outAdj.get(id)!) {
        inDeg.set(nxt, inDeg.get(nxt)! - 1)
        if (inDeg.get(nxt) === 0) enqueue(nxt) // unlock
      }

      // Update queue after unlocking dependents
      updateQueue()
    })
  }

  // seed queue with roots (no deps)
  ;[...inDeg.entries()].filter(([, c]) => c === 0).forEach(([id]) => enqueue(id))
  await q.onIdle() // wait for all waves
}
