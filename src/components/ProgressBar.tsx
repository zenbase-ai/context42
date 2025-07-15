import { Box, Text } from "ink"
import type React from "react"
import type { ProgressBarProps } from "../lib/types"

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, label }) => {
  const width = 40
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const filled = Math.round((percentage / 100) * width)
  const empty = width - filled

  return (
    <Box flexDirection="row" gap={1}>
      <Text>[</Text>
      <Text color="green">{"█".repeat(filled)}</Text>
      <Text dimColor>{"░".repeat(empty)}</Text>
      <Text>]</Text>
      {label && <Text>{label}</Text>}
      <Text>
        {value}/{max}
      </Text>
      <Text dimColor>({percentage}%)</Text>
    </Box>
  )
}
