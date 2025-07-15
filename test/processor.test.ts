import { expect, test, vi } from "vitest"
import { createStyleGuideProcessor } from "../src/lib/processor.ts"
import type { FileGroup } from "../src/lib/types.ts"

// Mock the generateStyleGuide function at the module level
vi.mock("../src/generator.ts", () => ({
  generateStyleGuide: vi.fn(async ({ language }) => {
    if (language === "typescript") {
      return "# TypeScript Style Guide\n\nMocked content"
    }
    if (language === "python") {
      return "# Python Style Guide\n\nMocked content"
    }
    return `# ${language.toUpperCase()} Style Guide\n\nMocked content`
  }),
}))

test("processor initializes workers correctly", () => {
  const processor = createStyleGuideProcessor({
    concurrency: 4,
    rootPath: "/test/dir",
  })

  // Get workers directly
  const workers = processor.workers

  // Should initialize 4 workers
  expect(workers.length).toBe(4)
  expect(workers.every(w => w.status === "idle")).toBe(true)
  expect(workers.map(w => w.id)).toEqual([1, 2, 3, 4])
})

test("processor processes file groups", async () => {
  const progressUpdates: Array<{ current: number; total: number }> = []

  const processor = createStyleGuideProcessor({
    concurrency: 2,
    onProgress: current => {
      progressUpdates.push({ current, total: 2 })
    },
    rootPath: "/test/dir",
  })

  const fileGroups: FileGroup[] = [
    {
      directory: "src",
      language: "typescript",
      files: ["file1.ts", "file2.ts"],
    },
    {
      directory: "scripts",
      language: "python",
      files: ["file1.py"],
    },
  ]

  const results = await processor.run(fileGroups, "/test/dir")

  // Check results
  expect(results.size).toBe(2)
  expect(results.has("typescript")).toBe(true)
  expect(results.has("python")).toBe(true)
  expect(results.get("typescript")?.includes("TypeScript Style Guide")).toBe(true)
  expect(results.get("python")?.includes("Python Style Guide")).toBe(true)

  // Check progress updates
  expect(progressUpdates.length).toBeGreaterThan(0)
  const lastProgress = progressUpdates[progressUpdates.length - 1]!
  expect(lastProgress.current).toBe(2)
  expect(lastProgress.total).toBe(2)
})

test("processor handles errors gracefully", async () => {
  // Import generateStyleGuide to mock it
  const { generateStyleGuide } = await import("../src/lib/generator.ts")
  // Set up mock to throw error
  vi.mocked(generateStyleGuide).mockRejectedValueOnce(new Error("API rate limit exceeded"))

  const progressUpdates: Array<{ current: number; total: number }> = []

  const processor = createStyleGuideProcessor({
    concurrency: 1,
    onProgress: current => {
      progressUpdates.push({ current, total: 2 })
    },
    rootPath: "/test/dir",
  })

  const fileGroups: FileGroup[] = [
    {
      directory: "src",
      language: "typescript",
      files: ["file1.ts"],
    },
  ]

  // Should not throw
  await processor.run(fileGroups, "/test/dir")

  // Progress should still be updated
  expect(progressUpdates.length).toBeGreaterThan(0)
  expect(progressUpdates[progressUpdates.length - 1]!.current).toBe(1)
})

test("processor reset clears state", () => {
  // We need to check the behavior, not the internal state
  let resetCalled = false

  const processor = createStyleGuideProcessor({
    concurrency: 2,
    rootPath: "/test/dir",
    onWorkerUpdate: w => {
      if (resetCalled) {
        // Check all workers are idle after reset
        expect(w.status === "idle").toBe(true)
        expect(w.directory === undefined).toBe(true)
      }
    },
  })

  // Reset and mark that we called it
  resetCalled = true
  processor.reset()

  // Verify workers were reset
  expect(processor.workers.length).toBe(2)
})
