import { Box, Text } from "ink"
import Spinner from "ink-spinner"
import type React from "react"
import type { WorkerStatusProps } from "../lib/types"

export const WorkerStatus: React.FC<WorkerStatusProps> = ({ workers }) => {
  if (workers.length === 0) return null

  return (
    <Box flexDirection="column" marginTop={1}>
      {workers.map(worker => (
        <Box key={worker.id} gap={1}>
          <Text dimColor>Worker {worker.id}:</Text>
          {worker.status === "working" && (
            <>
              <Text color="green">
                <Spinner type="dots" />
              </Text>
              <Text>
                Processing {worker.language} files in {worker.directory}
              </Text>
            </>
          )}
          {worker.status === "success" && <Text color="green">✓ Completed {worker.directory}</Text>}
          {worker.status === "error" && <Text color="red">✗ Failed: {worker.error || "Unknown error"}</Text>}
          {worker.status === "idle" && <Text dimColor>Idle</Text>}
        </Box>
      ))}
    </Box>
  )
}
