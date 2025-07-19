import type { DB } from "./database.js"

// === Callback Types ===
export type Callback<T> = (value: T) => void
export type AsyncCallback<T> = (value: T) => Promise<void>

// === Language & File Types ===
// Language is now just a string representing the file extension
export type Language = string

export type FileGroup = {
  readonly directory: string
  readonly language: Language
  readonly files: readonly string[]
}

// === Database Types ===
export type DatabaseRow = {
  id: number
  created_at: string
}

export type GeminiResponse = DatabaseRow & {
  project_path: string
  file_path: string
  response: string
  response_time: number
}

export type StyleGuide = DatabaseRow & {
  project_path: string
  language: string
  content: string
}

// === Worker Types ===
export type WorkerId = number
export type WorkerStatus = "starting" | "idle" | "working" | "success" | "error"
export type WorkerState = {
  directory: string
  language: string
  files: number
  processed: number
  error?: string
  progress?: string
}

export type Worker = Partial<WorkerState> & {
  id: WorkerId
  status: WorkerStatus
}

export type WorkerUpdate = Pick<
  Worker,
  "status" | "directory" | "language" | "files" | "processed" | "error" | "progress"
>

// === Options Types ===
export type BaseOptions = {
  onProgress?: Callback<number>
  onError?: Callback<Error>
}

export type ExplorerOptions = {
  directory: string
  ignore?: readonly string[]
}

export type ProcessorOptions = BaseOptions & {
  concurrency: number
  model: string
  onProgress?: Callback<number>
  onWorkerUpdate?: Callback<Worker>
  onQueueUpdate?: Callback<QueuedTask[]>
  inputDir: string
  database: DB
}

// === Processor State & Context ===
export type ProcessorState = { completed: undefined; total: undefined } | { completed: number; total: number }

export type DirectoryContext = {
  directory: string
  subdirectories: string[]
  processedStyleGuides: Map<string, string> // language -> style guide content
}

// === Processor Run & Interface Types ===
export type ProcessorRunOptions = {
  fileGroups: Map<Language, FileGroup[]>
  inputDir: string
  outputDir: string
}

export type QueuedTask = {
  id: string
  language: Language
  directory: string
  status: "ready" | "waiting"
  pendingDeps?: number
}

export type Processor = ProcessorState & {
  run(options: ProcessorRunOptions): Promise<Map<Language, string>>
  reset(): void
  workers: Worker[]
  queuedTasks: QueuedTask[]
}

// === CLI Phases ===
export const CLI_PHASES = ["explore", "process", "complete", "error"] as const
export type CLIPhase = (typeof CLI_PHASES)[number]
