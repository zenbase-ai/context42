import { Box, Text } from "ink"
import type React from "react"

export type ProgressBarProps = {
  readonly value: number
  readonly max: number
  readonly label?: string
  readonly terminalWidth?: number
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, label, terminalWidth = 80 }) => {
  const width = 40
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const filled = Math.round((percentage / 100) * width)
  const empty = width - filled

  // Calculate component width: [progress bar] + value/max + label + percentage
  const valueText = `${value}/${max}`
  const percentageText = `(${percentage}%)`
  const componentWidth = 2 + width + 1 + valueText.length + 1 + (label ? label.length + 1 : 0) + percentageText.length

  const leftPadding = Math.max(0, Math.floor((terminalWidth - componentWidth) / 2))

  return (
    <Box>
      <Text>{" ".repeat(leftPadding)}</Text>
      <Box flexDirection="row" gap={1}>
        <Text>[</Text>
        <Text color="green">{"█".repeat(filled)}</Text>
        <Text dimColor>{"░".repeat(empty)}</Text>
        <Text>]</Text>
        <Text>
          {value}/{max}
        </Text>
        {label && <Text>{label}</Text>}
        <Text dimColor>({percentage}%)</Text>
      </Box>
    </Box>
  )
}
