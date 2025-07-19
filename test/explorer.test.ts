import { resolve } from "node:path"
import { assert, expect, test } from "vitest"
import { explorer, getDirectoriesForProcessing, toposort } from "../src/lib/explorer"
import type { FileGroup, Language } from "../src/lib/types"

const repoDir = resolve(".")

test("explorer returns FileGroups grouped by language and directory", async () => {
  const fileGroupsMap = await explorer({ directory: repoDir })

  // Should return Maps for both ts and tsx extensions
  const tsGroups = fileGroupsMap.get("ts")
  const tsxGroups = fileGroupsMap.get("tsx")
  
  // We should have both ts and tsx files
  assert(tsGroups != null || tsxGroups != null)
  
  // Check that we have multiple directories with TypeScript files
  const allTsDirectories = new Set<string>()
  if (tsGroups) {
    tsGroups.forEach(g => allTsDirectories.add(g.directory))
  }
  if (tsxGroups) {
    tsxGroups.forEach(g => allTsDirectories.add(g.directory))
  }
  expect(allTsDirectories.size).toBeGreaterThanOrEqual(4)

  // Verify src/ directory contains tsx files
  const srcTsxGroup = tsxGroups?.find(g => g.directory === resolve("./src"))
  expect(srcTsxGroup).toBeTruthy()
  if (srcTsxGroup) {
    const fileNames = srcTsxGroup.files.map(f => f.split("/").pop())
    expect(fileNames).toContain("index.tsx")
    expect(fileNames).toContain("main.tsx")
  }

  // Verify src/lib directory contains its files
  const libGroup = tsGroups?.find(g => g.directory === resolve("./src/lib"))
  expect(libGroup).toBeTruthy()
  if (libGroup) {
    const fileNames = libGroup.files.map(f => f.split("/").pop())
    expect(fileNames).toContain("explorer.ts")
    expect(fileNames).toContain("types.ts")
  }
})

test.skip("explorer ignores node_modules and other default directories", async () => {
  const fileGroupsMap = await explorer({ directory: repoDir })

  // Should not find any files from ignored directories
  for (const fileGroups of fileGroupsMap.values()) {
    for (const group of fileGroups) {
      for (const file of group.files) {
        expect(file).not.toContain("node_modules")
        expect(file).not.toContain(".git")
        expect(file).not.toContain("dist")
        expect(file).not.toContain("build")
      }
    }
  }
})

test("getDirectoriesForProcessing returns unique sorted directories", async () => {
  const fileGroupsMap = await explorer({ directory: repoDir })
  const directories = getDirectoriesForProcessing(fileGroupsMap)

  // Should contain directories from fileGroups
  expect(directories.length).toBeGreaterThan(0)

  // All directories from fileGroups should be included
  const fileGroupDirs = new Set<string>()
  for (const fileGroups of fileGroupsMap.values()) {
    for (const group of fileGroups) {
      fileGroupDirs.add(group.directory)
    }
  }
  for (const dir of fileGroupDirs) {
    expect(directories).toContain(dir)
  }

  // Should be sorted by depth first, then alphabetically
  for (let i = 1; i < directories.length; i++) {
    const depthPrev = directories[i - 1]?.split("/").length
    const depthCur = directories[i]?.split("/").length
    expect(depthCur).toBeGreaterThanOrEqual(depthPrev)
  }
})

test("getFilesForDirectory returns files by language for a specific directory", async () => {
  // Since we're now using the repo directory, process.cwd() should work correctly
  const { getFilesForDirectory } = await import("../src/lib/explorer")
  const fileGroupsMap = await explorer({ directory: repoDir })

  // Test src/lib directory
  const srcLibFiles = getFilesForDirectory(fileGroupsMap, "src/lib")
  expect(srcLibFiles.size).toBeGreaterThan(0)
  expect(srcLibFiles.has("ts")).toBe(true)

  const tsFiles = srcLibFiles.get("ts")
  if (tsFiles) {
    const fileNames = tsFiles.map(f => f.split("/").pop())
    expect(fileNames).toContain("explorer.ts")
    expect(fileNames).toContain("types.ts")
  }
})

test("toposort processes deeper directories first", () => {
  // Create test file groups with clear parent-child relationships
  const fileGroups: Map<Language, FileGroup[]> = new Map([
    [
      "ts",
      [
        {
          directory: "/project",
          language: "ts",
          files: ["/project/index.ts"],
        },
        {
          directory: "/project/src",
          language: "ts",
          files: ["/project/src/main.ts"],
        },
        {
          directory: "/project/src/lib",
          language: "ts",
          files: ["/project/src/lib/utils.ts"],
        },
        {
          directory: "/project/src/components",
          language: "ts",
          files: ["/project/src/components/Button.tsx"],
        },
        {
          directory: "/project/src/lib/helpers",
          language: "ts",
          files: ["/project/src/lib/helpers/format.ts"],
        },
      ],
    ],
  ])

  const sorted = toposort(fileGroups)
  const tsGroups = sorted.get("ts")
  assert(tsGroups != null)
  const directories = tsGroups.map(g => g.directory)

  // Deeper directories should come first
  const projectIndex = directories.indexOf("/project")
  const srcIndex = directories.indexOf("/project/src")
  const libIndex = directories.indexOf("/project/src/lib")
  const helpersIndex = directories.indexOf("/project/src/lib/helpers")
  const componentsIndex = directories.indexOf("/project/src/components")

  // Deepest directories should be processed first
  expect(helpersIndex).toBeLessThan(libIndex) // helpers before lib
  expect(libIndex).toBeLessThan(srcIndex) // lib before src
  expect(componentsIndex).toBeLessThan(srcIndex) // components before src
  expect(srcIndex).toBeLessThan(projectIndex) // src before project
})

test("toposort handles multiple languages independently", () => {
  const fileGroups: Map<Language, FileGroup[]> = new Map([
    [
      "ts",
      [
        {
          directory: "/project/src",
          language: "ts",
          files: ["/project/src/index.ts"],
        },
        {
          directory: "/project/src/lib",
          language: "ts",
          files: ["/project/src/lib/utils.ts"],
        },
      ],
    ],
    [
      "py",
      [
        {
          directory: "/project/scripts",
          language: "py",
          files: ["/project/scripts/main.py"],
        },
        {
          directory: "/project/scripts/helpers",
          language: "py",
          files: ["/project/scripts/helpers/util.py"],
        },
      ],
    ],
  ])

  const sorted = toposort(fileGroups)

  // Check TypeScript ordering
  const tsGroups = sorted.get("ts")
  assert(tsGroups != null)
  expect(tsGroups[0]?.directory).toBe("/project/src/lib")
  expect(tsGroups[1]?.directory).toBe("/project/src")

  // Check Python ordering
  const pyGroups = sorted.get("py")
  assert(pyGroups != null)
  expect(pyGroups[0]?.directory).toBe("/project/scripts/helpers")
  expect(pyGroups[1]?.directory).toBe("/project/scripts")
})
