import { Box, Text } from "ink"
import Spinner from "ink-spinner"
import type React from "react"
import type { FileGroup, Language } from "../lib/types.js"

export type ExplorerStatusProps = {
  readonly fileGroups: Map<Language, FileGroup[]>
  readonly isLoading: boolean
}

export const ExplorerStatus: React.FC<ExplorerStatusProps> = ({ fileGroups, isLoading }) => {
  const foundLanguages = Array.from(fileGroups.keys())

  // Calculate total file count
  let fileCount = 0
  const languageCounts: Record<string, number> = {}

  for (const [language, groups] of fileGroups) {
    const languageFileCount = groups.reduce((sum, g) => sum + g.files.length, 0)
    languageCounts[language] = languageFileCount
    fileCount += languageFileCount
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box gap={1}>
        {isLoading && (
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
        )}
      </Box>
      {!isLoading && foundLanguages.length > 0 && (
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          <Text>
            Found {fileCount} files in {foundLanguages.length} languages
          </Text>
          <Box flexDirection="column" marginTop={1}>
            {Object.entries(languageCounts).map(([language, count]) => (
              <Text key={language} color="gray">
                • {language}: {count} files
              </Text>
            ))}
          </Box>
          <Box flexDirection="column" marginTop={1}>
            <Text color="dim">Directories:</Text>
            {[
              ...new Set(
                Array.from(fileGroups.values())
                  .flat()
                  .map(g => g.directory),
              ),
            ].map(dir => (
              <Text key={dir} color="gray">
                • {dir}
              </Text>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
