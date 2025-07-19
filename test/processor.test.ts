import { expect, test, vi } from "vitest"
import { DB } from "../src/lib/database"
import { createStyleGuideProcessor } from "../src/lib/processor"
import type { FileGroup, Language } from "../src/lib/types"

// Mock the generateStyleGuide function at the module level
vi.mock("../src/lib/generator", () => ({
  generateStyleGuide: vi.fn(async ({ language, childStyleGuides, onProgress }) => {
    // Simulate progress updates
    if (onProgress) {
      onProgress("Analyzing file structure...")
      onProgress("Detecting patterns...")
    }
    // Function now returns void
  }),
}))

// Mock fs/promises
vi.mock("node:fs/promises", () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}))

// Helper to create a test database
const createTestDatabase = (): DB => {
  const db = new DB(":memory:")
  db.init()

  // Pre-populate with some test data if needed
  db.saveStyleGuide("ts", "# Lib Style Guide", "src/lib")
  db.saveStyleGuide("ts", "# Components Style Guide", "src/components")

  return db
}

test("processor initializes workers correctly", () => {
  const database = createTestDatabase()
  const processor = createStyleGuideProcessor({
    model: "test-model",
    concurrency: 4,
    inputDir: "/test/dir",
    database,
  })

  // Get workers directly
  const { workers } = processor

  expect(workers).toHaveLength(4)
  expect(workers.every(w => w.status === "idle")).toBe(true)
  expect(workers.map(w => w.id)).toEqual([1, 2, 3, 4])

  database.close()
})

test("processor processes file groups", async () => {
  const progressUpdates: Array<{ current: number; total: number }> = []
  const database = createTestDatabase()

  const processor = createStyleGuideProcessor({
    concurrency: 2,
    model: "test-model",
    database,
    onProgress: current => {
      progressUpdates.push({ current, total: 3 })
    },
    inputDir: "/test/dir",
  })

  const fileGroups = new Map<Language, FileGroup[]>([
    [
      "ts",
      [
        {
          language: "ts",
          directory: "/test/src",
          files: ["index.ts", "app.tsx"],
        },
        {
          language: "ts",
          directory: "/test/lib",
          files: ["utils.ts"],
        },
      ],
    ],
    [
      "py",
      [
        {
          language: "py",
          directory: "/test/scripts",
          files: ["main.py"],
        },
      ],
    ],
  ])

  const results = await processor.run({
    fileGroups,
    inputDir: "/test/dir",
    outputDir: "/test/output",
  })

  // Check results (now returns map with languages for UI display)
  expect(results.size).toBe(2)
  expect(results.has("ts")).toBe(true)
  expect(results.has("py")).toBe(true)
  expect(results.get("ts")).toBe("ts.md")
  expect(results.get("py")).toBe("py.md")

  // Check progress updates (based on files, not groups)
  // Group 1: 2 files, Group 2: 1 file, Group 3: 1 file = 4 total files
  expect(progressUpdates.length).toBeGreaterThan(0)
  expect(progressUpdates[progressUpdates.length - 1]).toEqual({ current: 4, total: 3 })

  // Verify style guides were saved to database
  const tsGuide = database.getStyleGuide("ts", "/test/src")
  expect(tsGuide).not.toBeNull()
  expect(tsGuide?.content).toContain("TS Style Guide")

  database.close()
})

test("processor handles errors gracefully", async () => {
  const { generateStyleGuide: generateStyleGuide } = await import("../src/lib/generator")
  const database = createTestDatabase()

  // Mock to throw error
  vi.mocked(generateStyleGuide).mockRejectedValueOnce(new Error("Generation failed"))

  const workerUpdates: Array<{ id: number; status: string; error?: string }> = []

  const progressUpdates: Array<{ current: number; total: number }> = []

  const processor = createStyleGuideProcessor({
    concurrency: 1,
    model: "test-model",
    database,
    onProgress: current => {
      progressUpdates.push({ current, total: 2 })
    },
    onWorkerUpdate: worker => {
      workerUpdates.push({
        id: worker.id,
        status: worker.status,
        error: worker.error,
      })
    },
    inputDir: "/test/dir",
  })

  const fileGroups = new Map<Language, FileGroup[]>([
    [
      "ts",
      [
        {
          language: "ts",
          directory: "/test/src",
          files: ["index.ts"],
        },
        {
          language: "ts",
          directory: "/test/lib",
          files: ["utils.ts"],
        },
      ],
    ],
  ])

  await processor.run({
    fileGroups,
    inputDir: "/test/dir",
    outputDir: "/test/output",
  })

  // Worker should have error status
  const errorUpdate = workerUpdates.find(u => u.status === "error")
  expect(errorUpdate).toBeDefined()
  expect(errorUpdate?.error).toBe("Generation failed")

  // Progress should still increment
  expect(progressUpdates).toEqual([
    { current: 1, total: 2 },
    { current: 2, total: 2 },
  ])

  database.close()
})

test("processor queries child style guides and passes them to generator", async () => {
  const { generateStyleGuide: generateStyleGuide } = await import("../src/lib/generator")
  const database = createTestDatabase()

  const processor = createStyleGuideProcessor({
    concurrency: 1,
    model: "test-model",
    inputDir: "/test/dir",
    database,
  })

  const fileGroups = new Map<Language, FileGroup[]>([
    [
      "ts",
      [
        {
          language: "ts",
          directory: "src",
          files: ["index.ts"],
        },
      ],
    ],
  ])

  await processor.run({
    fileGroups,
    inputDir: "/test/dir",
    outputDir: "/test/output",
  })

  // Verify generateStyleGuide was called with correct parameters
  // The 6th call should be for the root directory with child guides
  const calls = vi.mocked(generateStyleGuide).mock.calls
  const rootCall = calls.find(call =>
    call[0].childStyleGuides &&
    Object.keys(call[0].childStyleGuides).length > 0
  )

  expect(rootCall).toBeDefined()
  expect(rootCall![0]).toMatchObject({
    model: "test-model",
    files: ["index.ts"],
    language: "ts",
    childStyleGuides: {
      lib: "# Lib Style Guide",
      components: "# Components Style Guide",
    },
  })

  database.close()
})

test("processor reset clears state", async () => {
  const database = createTestDatabase()

  // We need to check the behavior, not the internal state
  let resetCalled = false

  const processor = createStyleGuideProcessor({
    model: "test-model",
    concurrency: 2,
    inputDir: "/test/dir",
    database,
    onWorkerUpdate: worker => {
      if (worker.status === "idle" && !worker.directory && !worker.language) {
        resetCalled = true
      }
    },
  })

  // Create some work
  const fileGroups = new Map<Language, FileGroup[]>([
    [
      "ts",
      [
        {
          language: "ts",
          directory: "/test/src",
          files: ["index.ts"],
        },
      ],
    ],
  ])

  // Run some work
  await processor.run({
    fileGroups,
    inputDir: "/test/dir",
    outputDir: "/test/output",
  })

  // Reset
  processor.reset()

  // After reset, workers should be updated to idle state
  expect(resetCalled).toBe(true)

  database.close()
})

test("processor distributes work across multiple workers concurrently", async () => {
  const { generateStyleGuide: generateStyleGuide } = await import("../src/lib/generator")
  const database = createTestDatabase()

  // Track which workers are active
  const activeWorkers = new Set<number>()
  const concurrentWorkerCounts: number[] = []

  // Mock generateStyleGuide to introduce delay
  vi.mocked(generateStyleGuide).mockImplementation(async ({ language }) => {
    await new Promise(resolve => setTimeout(resolve, 50))
  })

  const processor = createStyleGuideProcessor({
    model: "test-model",
    concurrency: 3,
    inputDir: "/test/dir",
    database,
    onWorkerUpdate: worker => {
      if (worker.status === "working") {
        activeWorkers.add(worker.id)
        concurrentWorkerCounts.push(activeWorkers.size)
      } else if (worker.status === "success" || worker.status === "error") {
        activeWorkers.delete(worker.id)
      }
    },
  })

  // Create work that can run concurrently
  const fileGroups = new Map<Language, FileGroup[]>([
    [
      "ts",
      [
        { language: "ts", directory: "/test/src1", files: ["file1.ts"] },
        { language: "ts", directory: "/test/src2", files: ["file2.ts"] },
        { language: "ts", directory: "/test/src3", files: ["file3.ts"] },
        { language: "ts", directory: "/test/src4", files: ["file4.ts"] },
        { language: "ts", directory: "/test/src5", files: ["file5.ts"] },
      ],
    ],
  ])

  await processor.run({
    fileGroups,
    inputDir: "/test/dir",
    outputDir: "/test/output",
  })

  // Calculate the maximum number of concurrent workers
  const maxConcurrentWorkers = Math.max(...concurrentWorkerCounts)

  // Verify we had concurrent execution (more than 1 worker active at once)
  expect(maxConcurrentWorkers).toBeGreaterThan(1)

  // Verify all tasks were processed
  const savedGuides = [
    database.getStyleGuide("ts", "/test/src1"),
    database.getStyleGuide("ts", "/test/src2"),
    database.getStyleGuide("ts", "/test/src3"),
    database.getStyleGuide("ts", "/test/src4"),
    database.getStyleGuide("ts", "/test/src5"),
  ]
  expect(savedGuides.every(g => g !== null)).toBe(true)

  database.close()
})

test("processor respects concurrency limit", async () => {
  const { generateStyleGuide: generateStyleGuide } = await import("../src/lib/generator")
  const database = createTestDatabase()

  const activeWorkers = new Set<number>()
  const concurrentWorkerCounts: number[] = []

  // Mock with delay to force concurrent execution
  vi.mocked(generateStyleGuide).mockImplementation(async () => {
    await new Promise(resolve => setTimeout(resolve, 20))
  })

  const processor = createStyleGuideProcessor({
    model: "test-model",
    concurrency: 2, // Only 2 workers
    inputDir: "/test/dir",
    database,
    onWorkerUpdate: worker => {
      if (worker.status === "working") {
        activeWorkers.add(worker.id)
        concurrentWorkerCounts.push(activeWorkers.size)
      } else if (worker.status === "success" || worker.status === "error") {
        activeWorkers.delete(worker.id)
      }
    },
  })

  // Create 5 tasks for 2 workers
  const fileGroups = new Map<Language, FileGroup[]>([
    [
      "ts",
      Array.from({ length: 5 }, (_, i) => ({
        language: "ts" as Language,
        directory: `/test/src${i}`,
        files: [`file${i}.ts`],
      })),
    ],
  ])

  await processor.run({
    fileGroups,
    inputDir: "/test/dir",
    outputDir: "/test/output",
  })

  // Verify we never exceeded the concurrency limit
  expect(Math.max(...concurrentWorkerCounts)).toBeLessThanOrEqual(2)

  // Verify we actually used 2 workers concurrently at some point
  expect(Math.max(...concurrentWorkerCounts)).toBe(2)

  database.close()
})

test("processor reuses workers after completion", async () => {
  const { generateStyleGuide: generateStyleGuide } = await import("../src/lib/generator")
  const database = createTestDatabase()

  const workerTaskMap: Record<number, string[]> = {}

  // Fast mock to ensure sequential processing
  vi.mocked(generateStyleGuide).mockImplementation(async () =>
    undefined
  )

  const processor = createStyleGuideProcessor({
    model: "test-model",
    concurrency: 2, // Only 2 workers for 5 tasks
    inputDir: "/test/dir",
    database,
    onWorkerUpdate: worker => {
      if (worker.status === "working" && worker.directory) {
        if (!workerTaskMap[worker.id]) {
          workerTaskMap[worker.id] = []
        }
        workerTaskMap[worker.id].push(worker.directory)
      }
    },
  })

  const fileGroups = new Map<Language, FileGroup[]>([
    [
      "ts",
      Array.from({ length: 5 }, (_, i) => ({
        language: "ts" as Language,
        directory: `/test/src${i}`,
        files: [`file${i}.ts`],
      })),
    ],
  ])

  await processor.run({
    fileGroups,
    inputDir: "/test/dir",
    outputDir: "/test/output",
  })

  // Each worker should have processed multiple tasks
  const workerIds = Object.keys(workerTaskMap).map(Number)
  expect(workerIds.length).toBe(2) // Only 2 workers used

  // Check that workers were reused (processed multiple tasks)
  const totalTasks = Object.values(workerTaskMap).reduce((sum, tasks) => sum + tasks.length, 0)
  expect(totalTasks).toBe(5)

  // Each worker should have processed at least 2 tasks (reused)
  expect(Object.values(workerTaskMap).some(tasks => tasks.length >= 2)).toBe(true)

  database.close()
})

test("processor handles uneven work distribution", async () => {
  const database = createTestDatabase()
  const workerTaskCounts: Record<number, number> = {}

  const processor = createStyleGuideProcessor({
    model: "test-model",
    concurrency: 3,
    inputDir: "/test/dir",
    database,
    onWorkerUpdate: worker => {
      if (worker.status === "working") {
        workerTaskCounts[worker.id] = (workerTaskCounts[worker.id] || 0) + 1
      }
    },
  })

  // Create uneven work distribution
  const fileGroups = new Map<Language, FileGroup[]>([
    [
      "ts",
      [
        { language: "ts", directory: "/test/src1", files: ["file1.ts"] },
        { language: "ts", directory: "/test/src2", files: ["file2.ts"] },
        { language: "ts", directory: "/test/src3", files: ["file3.ts"] },
        { language: "ts", directory: "/test/src4", files: ["file4.ts"] },
      ],
    ],
  ])

  const results = await processor.run({
    fileGroups,
    inputDir: "/test/dir",
    outputDir: "/test/output",
  })

  // Results should contain the processed language
  expect(results.size).toBe(1)
  expect(results.has("ts")).toBe(true)

  // Total of 4 tasks distributed across workers
  const totalTasksProcessed = Object.values(workerTaskCounts).reduce((sum, count) => sum + count, 0)
  expect(totalTasksProcessed).toBe(4)

  // At least 2 workers should have been used (with 3 available and 4 tasks)
  expect(Object.keys(workerTaskCounts).length).toBeGreaterThanOrEqual(2)

  database.close()
})

test("processor assigns work to available workers correctly", async () => {
  const { generateStyleGuide: generateStyleGuide } = await import("../src/lib/generator")
  const database = createTestDatabase()

  const workerAssignments: Array<{ workerId: number; directory: string }> = []

  // Mock to track assignments
  vi.mocked(generateStyleGuide).mockImplementation(async () => {
    // Function returns void now
  })

  const processor = createStyleGuideProcessor({
    model: "test-model",
    concurrency: 3,
    inputDir: "/test/dir",
    database,
    onWorkerUpdate: worker => {
      if (worker.status === "working" && worker.directory) {
        workerAssignments.push({
          workerId: worker.id,
          directory: worker.directory,
        })
      }
    },
  })

  const fileGroups = new Map<Language, FileGroup[]>([
    [
      "ts",
      [
        { language: "ts", directory: "/src1", files: ["file1.ts"] },
        { language: "ts", directory: "/src2", files: ["file2.ts"] },
        { language: "ts", directory: "/src3", files: ["file3.ts"] },
      ],
    ],
  ])

  await processor.run({
    fileGroups,
    inputDir: "/test/dir",
    outputDir: "/test/output",
  })

  // All tasks should be assigned
  expect(workerAssignments).toHaveLength(3)

  // Each task should be assigned to a valid worker
  expect(workerAssignments.every(a => a.workerId >= 1 && a.workerId <= 3)).toBe(true)

  // All directories should be processed
  const processedDirs = workerAssignments.map(a => a.directory).sort()
  expect(processedDirs).toEqual(["/src1", "/src2", "/src3"])

  database.close()
})

test("processor cleans up style files on successful completion", async () => {
  const { rename, unlink } = await import("node:fs/promises")
  const database = createTestDatabase()

  // Reset mocks
  vi.mocked(rename).mockReset().mockResolvedValue(undefined)
  vi.mocked(unlink).mockReset().mockResolvedValue(undefined)

  const processor = createStyleGuideProcessor({
    model: "test-model",
    concurrency: 2,
    inputDir: "/test/dir",
    database,
  })

  const fileGroups = new Map<Language, FileGroup[]>([
    [
      "ts",
      [
        { language: "ts", directory: "/test/src", files: ["index.ts"] },
        { language: "ts", directory: "/test/lib", files: ["utils.ts"] },
      ],
    ],
    [
      "py",
      [
        { language: "py", directory: "/test/scripts", files: ["main.py"] },
      ],
    ],
  ])

  await processor.run({
    fileGroups,
    inputDir: "/test/dir",
    outputDir: "/test/output",
  })

  // Verify rename was called (last directory wins for each language)
  expect(vi.mocked(rename)).toHaveBeenCalledWith(
    "/test/lib/style.ts.md",
    "/test/output/ts.md"
  )
  expect(vi.mocked(rename)).toHaveBeenCalledWith(
    "/test/scripts/style.py.md",
    "/test/output/py.md"
  )

  // Verify unlink was called for the first typescript file (not moved)
  expect(vi.mocked(unlink)).toHaveBeenCalledWith("/test/src/style.ts.md")

  database.close()
})

test("processor cleans up style files on rename failure", async () => {
  const { rename, unlink } = await import("node:fs/promises")
  const database = createTestDatabase()

  // Reset mocks
  vi.mocked(rename).mockReset().mockRejectedValue(new Error("Permission denied"))
  vi.mocked(unlink).mockReset().mockResolvedValue(undefined)

  const processor = createStyleGuideProcessor({
    model: "test-model",
    concurrency: 1,
    inputDir: "/test/dir",
    database,
  })

  const fileGroups = new Map<Language, FileGroup[]>([
    [
      "ts",
      [
        { language: "ts", directory: "/test/src", files: ["index.ts"] },
      ],
    ],
  ])

  await processor.run({
    fileGroups,
    inputDir: "/test/dir",
    outputDir: "/test/output",
  })

  // Verify rename was attempted
  expect(vi.mocked(rename)).toHaveBeenCalledWith(
    "/test/src/style.ts.md",
    "/test/output/ts.md"
  )

  // Verify unlink was called to clean up the file
  expect(vi.mocked(unlink)).toHaveBeenCalledWith("/test/src/style.ts.md")

  database.close()
})

test("processor cleans up style files on error during generation", async () => {
  const { generateStyleGuide } = await import("../src/lib/generator")
  const { rename, unlink } = await import("node:fs/promises")
  const database = createTestDatabase()

  // Reset mocks
  vi.mocked(rename).mockReset().mockResolvedValue(undefined)
  vi.mocked(unlink).mockReset().mockResolvedValue(undefined)

  // Mock to fail on python file
  vi.mocked(generateStyleGuide).mockImplementation(async ({ language }) => {
    if (language === "py") {
      throw new Error("Generation failed")
    }
  })

  const processor = createStyleGuideProcessor({
    model: "test-model",
    concurrency: 1,
    inputDir: "/test/dir",
    database,
  })

  const fileGroups = new Map<Language, FileGroup[]>([
    [
      "ts",
      [
        { language: "ts", directory: "/test/src", files: ["index.ts"] },
      ],
    ],
    [
      "py",
      [
        { language: "py", directory: "/test/scripts", files: ["main.py"] }, // This will fail
      ],
    ],
  ])

  await processor.run({
    fileGroups,
    inputDir: "/test/dir",
    outputDir: "/test/output",
  })

  // TypeScript file should have been moved successfully
  expect(vi.mocked(rename)).toHaveBeenCalledWith(
    "/test/src/style.ts.md",
    "/test/output/ts.md"
  )

  // No files should be cleaned up - python file wasn't created due to error
  expect(vi.mocked(unlink)).not.toHaveBeenCalled()

  database.close()
})

test("processor uses correct file extensions for different languages", async () => {
  const { generateStyleGuide } = await import("../src/lib/generator")
  const database = createTestDatabase()

  // Reset mock to default behavior
  vi.mocked(generateStyleGuide).mockReset().mockResolvedValue(undefined)

  const languageFileGroups: Array<[Language, string]> = [
    ["js", "js"],
    ["py", "py"],
    ["rb", "rb"],
    ["go", "go"],
    ["java", "java"],
    ["rs", "rs"],
    ["tsx", "tsx"],
    ["jsx", "jsx"],
  ]

  for (const [language, extension] of languageFileGroups) {
    const processor = createStyleGuideProcessor({
      model: "test-model",
      concurrency: 1,
      inputDir: "/test/dir",
      database,
    })

    const fileGroups = new Map<Language, FileGroup[]>([
      [
        language,
        [
          { language, directory: `/test/${language}`, files: [`file.${extension}`] },
        ],
      ],
    ])

    await processor.run({
      fileGroups,
      inputDir: "/test/dir",
      outputDir: "/test/output",
    })

    // Verify the correct style file was created
    const styleGuide = database.getStyleGuide(language, `/test/${language}`)
    expect(styleGuide).not.toBeNull()
  }

  database.close()
})

test("processor respects directory dependencies - children processed before parents", async () => {
  const { generateStyleGuide: generateStyleGuide } = await import("../src/lib/generator")
  const database = createTestDatabase()

  // Track processing order
  const processingOrder: string[] = []
  const childGuidesSeenByParent: Record<string, string[]> = {}

  // Mock to track when each directory is processed and what child guides it sees
  vi.mocked(generateStyleGuide).mockImplementation(async ({ childStyleGuides }) => {
    // Record what child guides the parent sees
    const currentDir = processingOrder[processingOrder.length - 1] || "unknown"
    if (childStyleGuides) {
      childGuidesSeenByParent[currentDir] = Object.keys(childStyleGuides)
    }
  })

  const processor = createStyleGuideProcessor({
    model: "test-model",
    concurrency: 3,
    inputDir: "/test/dir",
    database,
    onWorkerUpdate: worker => {
      if (worker.status === "working" && worker.directory) {
        processingOrder.push(worker.directory)
      }
    },
  })

  // Create a hierarchy: parent -> child -> grandchild
  const fileGroups = new Map<Language, FileGroup[]>([
    [
      "ts",
      [
        { language: "ts", directory: "/app", files: ["app.ts"] },
        { language: "ts", directory: "/app/src", files: ["index.ts"] },
        { language: "ts", directory: "/app/src/lib", files: ["utils.ts"] },
        { language: "ts", directory: "/app/src/components", files: ["Button.tsx"] },
        { language: "ts", directory: "/app/test", files: ["test.ts"] },
      ],
    ],
  ])

  await processor.run({
    fileGroups,
    inputDir: "/test/dir",
    outputDir: "/test/output",
  })

  // Verify processing order: children should be processed before parents
  const appIndex = processingOrder.indexOf("/app")
  const srcIndex = processingOrder.indexOf("/app/src")
  const libIndex = processingOrder.indexOf("/app/src/lib")
  const componentsIndex = processingOrder.indexOf("/app/src/components")
  const testIndex = processingOrder.indexOf("/app/test")


  // Grandchildren before children
  expect(libIndex).toBeLessThan(srcIndex)
  expect(componentsIndex).toBeLessThan(srcIndex)

  // Children before parent
  expect(srcIndex).toBeLessThan(appIndex)
  expect(testIndex).toBeLessThan(appIndex)

  // Verify parent directories saw their children's style guides
  // /app should see guides from src and test
  expect(childGuidesSeenByParent["/app"]).toContain("src")
  expect(childGuidesSeenByParent["/app"]).toContain("test")

  // /app/src should see guides from lib and components
  expect(childGuidesSeenByParent["/app/src"]).toContain("lib")
  expect(childGuidesSeenByParent["/app/src"]).toContain("components")

  database.close()
})
