import { Box, Text } from "ink"
import Spinner from "ink-spinner"
import type React from "react"
import type { ExplorerStatusProps } from "../lib/types"

export const ExplorerStatus: React.FC<ExplorerStatusProps> = ({ fileGroups, isLoading }) => {
  const foundLanguages = fileGroups.map(g => g.language)
  const fileCount = fileGroups.reduce((sum, g) => sum + g.files.length, 0)

  // Group by language to show counts
  const languageCounts = fileGroups.reduce(
    (counts, group) => {
      counts[group.language] = (counts[group.language] || 0) + group.files.length
      return counts
    },
    {} as Record<string, number>,
  )

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box gap={1}>
        {isLoading && (
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
        )}
        <Text bold>{isLoading ? "Exploring..." : "Exploration complete"}</Text>
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
            {[...new Set(fileGroups.map(g => g.directory))].map(dir => (
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
