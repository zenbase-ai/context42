import { glob } from "glob"
import { statSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import type { ExplorerOptions, FileGroup, Language } from "./types"
import { LANGUAGE_EXTENSIONS } from "./types"

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

export const discoverFiles = (options: ExplorerOptions): FileGroup[] => {
  const { directory, ignore = [] } = options
  const allIgnore = [...DEFAULT_IGNORE, ...ignore]

  // Create glob patterns for each language
  type MutableFileGroup = {
    language: Language
    files: string[]
    directory: string
  }
  const fileGroups = new Map<Language, MutableFileGroup>()

  for (const [language, extensions] of Object.entries(LANGUAGE_EXTENSIONS)) {
    const files: string[] = []
    let commonDirectory = ""

    // Search for files with these extensions
    for (const ext of extensions) {
      const pattern = join(directory, `**/*${ext}`)
      const matches = glob.sync(pattern, {
        ignore: allIgnore,
        absolute: true,
        nodir: true,
      })

      // Add files and track their directories
      for (const file of matches) {
        // Skip if file is too large (> 1MB)
        try {
          const stats = statSync(file)
          if (stats.size > 1024 * 1024) continue
        } catch {
          continue
        }

        files.push(file)
        if (!commonDirectory) {
          commonDirectory = dirname(file)
        }
      }
    }

    // Only include languages with files found
    if (files.length > 0) {
      fileGroups.set(language as Language, {
        language: language as Language,
        files,
        directory: relative(directory, commonDirectory) || ".",
      })
    }
  }

  // Convert to readonly types
  return Array.from(fileGroups.values()).map(group => ({
    directory: group.directory,
    language: group.language,
    files: Object.freeze(group.files) as readonly string[],
  }))
}

export const getDirectoriesForProcessing = (fileGroups: FileGroup[]): string[] => {
  const allDirectories = new Set<string>()

  for (const group of fileGroups) {
    allDirectories.add(group.directory)
  }

  // Sort directories by depth (process parent directories first)
  return Array.from(allDirectories).sort((a, b) => {
    const depthA = a.split("/").length
    const depthB = b.split("/").length
    if (depthA !== depthB) return depthA - depthB
    return a.localeCompare(b)
  })
}

export const getFilesForDirectory = (fileGroups: FileGroup[], directory: string): Map<string, string[]> => {
  const result = new Map<string, string[]>()

  for (const group of fileGroups) {
    const filesInDir = group.files.filter(file => {
      const fileDir = dirname(file)
      const relativeDir = relative(process.cwd(), fileDir) || "."
      return relativeDir === directory
    })

    if (filesInDir.length > 0) {
      result.set(group.language, filesInDir)
    }
  }

  return result
}

export const getSupportedLanguages = (): readonly Language[] => {
  return Object.keys(LANGUAGE_EXTENSIONS) as Language[]
}
