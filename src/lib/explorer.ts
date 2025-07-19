import { stat } from "node:fs/promises"
import { dirname, extname, join, relative } from "node:path"
import { globby } from "globby"
import type { ExplorerOptions, FileGroup, Language } from "./types.js"

const DEFAULT_IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/.next/**",
  "**/.nuxt/**",
  "**/venv/**",
  "**/__pycache__/**",
  "**/*.min.js",
  "**/*.min.css",
  "**/vendor/**",
  "**/.cache/**",
  "**/tmp/**",
  "**/temp/**",
]

export const explorer = async (options: ExplorerOptions): Promise<Map<Language, FileGroup[]>> => {
  const ignore = [...DEFAULT_IGNORE, ...(options.ignore ?? [])]

  // Find all files in the directory
  const pattern = join(options.directory, "**/*")
  const allFiles = await globby(pattern, {
    ignore,
    gitignore: true,
    absolute: true,
    onlyFiles: true,
  })

  // Group files by extension
  const filesByExtension = new Map<string, string[]>()

  for (const file of allFiles) {
    // Skip files that are too large
    const { size } = await stat(file)
    if (size > 512 * 1024) continue // Skip files larger than 0.5MB

    // Get the extension (without the dot)
    const ext = extname(file).slice(1).toLowerCase()
    if (!ext) continue // Skip files without extensions

    if (!filesByExtension.has(ext)) {
      filesByExtension.set(ext, [])
    }
    filesByExtension.get(ext)!.push(file)
  }

  // Now group by directory within each extension
  const result = new Map<Language, FileGroup[]>()

  for (const [extension, files] of filesByExtension) {
    const extensionFileGroups: FileGroup[] = []

    // Group files by their parent directory
    const filesByDirectory = new Map<string, string[]>()

    for (const file of files) {
      const directory = dirname(file)
      if (!filesByDirectory.has(directory)) {
        filesByDirectory.set(directory, [])
      }
      filesByDirectory.get(directory)?.push(file)
    }

    // Create a FileGroup for each directory
    for (const [directory, dirFiles] of filesByDirectory) {
      extensionFileGroups.push({
        directory,
        language: extension, // The extension IS the language
        files: Object.freeze(dirFiles) as readonly string[],
      })
    }

    result.set(extension, extensionFileGroups)
  }

  return toposort(result)
}

export const getDirectoriesForProcessing = (fileGroupsMap: Map<Language, FileGroup[]>): string[] => {
  const allDirectories = new Set<string>()

  for (const fileGroups of fileGroupsMap.values()) {
    for (const group of fileGroups) {
      allDirectories.add(group.directory)
    }
  }

  // Sort directories by depth (process parent directories first)
  return Array.from(allDirectories).sort((a, b) => {
    const depthA = a.split("/").length
    const depthB = b.split("/").length
    if (depthA !== depthB) return depthA - depthB
    return a.localeCompare(b)
  })
}

export const getFilesForDirectory = (
  fileGroupsMap: Map<Language, FileGroup[]>,
  directory: string,
): Map<string, string[]> => {
  const result = new Map<string, string[]>()

  for (const [language, fileGroups] of fileGroupsMap) {
    for (const group of fileGroups) {
      const filesInDir = group.files.filter(file => {
        const fileDir = dirname(file)
        const relativeDir = relative(process.cwd(), fileDir) || "."
        return relativeDir === directory
      })

      if (filesInDir.length > 0) {
        result.set(language, filesInDir)
      }
    }
  }

  return result
}

export const getSupportedLanguages = (): readonly Language[] => {
  // This function is no longer meaningful since we support any extension
  // Return empty array to maintain compatibility
  return []
}

// Helper function to check if one directory is a child of another
const isChildDirectory = (child: string, parent: string): boolean => {
  if (child === parent) return false
  const childParts = child.split("/")
  const parentParts = parent.split("/")

  if (childParts.length <= parentParts.length) return false

  for (let i = 0; i < parentParts.length; i++) {
    if (childParts[i] !== parentParts[i]) return false
  }

  return true
}

// Topological sort for FileGroups to ensure child directories are processed before parents
export const toposort = (fileGroups: Map<Language, FileGroup[]>): Map<Language, FileGroup[]> => {
  const result = new Map<Language, FileGroup[]>()

  // Process each language separately
  for (const [language, groups] of fileGroups) {
    if (groups.length === 0) {
      result.set(language, [])
      continue
    }

    // Build adjacency list (parent -> children)
    const adjacency = new Map<string, Set<string>>()
    const inDegree = new Map<string, number>()
    const directories = groups.map(g => g.directory)

    // Initialize
    for (const dir of directories) {
      adjacency.set(dir, new Set())
      inDegree.set(dir, 0)
    }

    // Build edges (parent depends on children, so children must come first)
    for (const parent of directories) {
      for (const child of directories) {
        if (isChildDirectory(child, parent)) {
          // Check if it's a direct child (no intermediate directories)
          const isDirectChild = !directories.some(
            d => d !== child && d !== parent && isChildDirectory(child, d) && isChildDirectory(d, parent),
          )

          if (isDirectChild) {
            adjacency.get(parent)?.add(child)
            inDegree.set(child, inDegree.get(child)! + 1)
          }
        }
      }
    }

    // Topological sort using DFS
    const visited = new Set<string>()
    const sorted: string[] = []

    const dfs = (dir: string) => {
      if (visited.has(dir)) return
      visited.add(dir)

      // Visit all children first
      const children = Array.from(adjacency.get(dir)!).sort()
      for (const child of children) {
        dfs(child)
      }

      sorted.push(dir)
    }

    // Start DFS from roots (directories with no parents)
    const roots = directories
      .filter(d => {
        // A root has no parent directory in our list
        return !directories.some(other => other !== d && isChildDirectory(d, other))
      })
      .sort()

    for (const root of roots) {
      dfs(root)
    }

    // Create sorted FileGroup array
    const sortedGroups = sorted.map(dir => groups.find(g => g.directory === dir)!).filter(Boolean)
    result.set(language, sortedGroups)
  }

  return result
}
