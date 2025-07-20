import { join, relative } from "node:path"
import { Box, Text } from "ink"
import type React from "react"
import { useMemo } from "react"
import type { QueuedTask, Worker } from "../lib/types.js"
import Table from "./Table.js"

export type WorkersStatusProps = {
  inputDir: string
  readonly workers: readonly Worker[]
  readonly queuedTasks?: readonly QueuedTask[]
}

const globpath = (inputDir: string, directory: string, language: string) =>
  join(relative(inputDir, directory) || "./", `*.${language}`)

export const WorkersStatus: React.FC<WorkersStatusProps> = ({ workers, inputDir, queuedTasks = [] }) => {
  const waitingTasks = queuedTasks.filter(t => t.status === "waiting").slice(0, workers.length)
  const workersViewModel = useMemo(
    () =>
      workers
        .map(agent => ({
          agent: agent.id,
          directory: agent.directory && agent.language ? globpath(inputDir, agent.directory, agent.language) : "",
          status:
            agent.status === "idle"
              ? "Waiting..."
              : agent.status === "working"
                ? agent.progress || "Discovering..."
                : agent.status === "success"
                  ? "Success"
                  : agent.error,
        }))
        .filter(agent => agent.directory),
    [workers, inputDir],
  )
  const columnWidths = useMemo(() => ({ agent: 8, directory: 22, status: 90 }), [])

  if (workersViewModel.length === 0) return null

  return (
    <Box flexDirection="column" marginTop={1}>
      <Table data={workersViewModel} columnWidths={columnWidths} />

      {/* Waiting tasks */}
      {waitingTasks.length !== 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text dimColor>Queue: {waitingTasks.length}</Text>
          {waitingTasks.map((task, index) => (
            <Box key={`waiting-${task.id}-${index}`} marginLeft={2}>
              <Text dimColor>
                {globpath(inputDir, task.directory, task.language)}
                {task.pendingDeps && ` (${task.pendingDeps} dep${task.pendingDeps > 1 ? "s" : ""})`}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
