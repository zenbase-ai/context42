import { unlink } from "node:fs/promises"

type CleanupHandler = () => void | Promise<void>

class CleanupRegistry {
  private handlers = new Set<CleanupHandler>()
  private isShuttingDown = false

  register(handler: CleanupHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  async cleanup(): Promise<void> {
    if (this.isShuttingDown) return
    this.isShuttingDown = true

    const promises: Promise<void>[] = []
    for (const handler of this.handlers) {
      try {
        const result = handler()
        if (result instanceof Promise) {
          promises.push(result.catch(console.error))
        }
      } catch (error) {
        console.error("Cleanup handler error:", error)
      }
    }

    await Promise.all(promises)
  }

  reset(): void {
    this.handlers.clear()
    this.isShuttingDown = false
  }
}

// Global singleton instance
export const cleanupRegistry = new CleanupRegistry()

// Helper for cleaning up files
export const createFileCleanupHandler = (files: Set<string>): CleanupHandler => {
  return async () => {
    const promises: Promise<void>[] = []
    for (const file of files) {
      promises.push(
        unlink(file).catch(error => {
          // Ignore file not found errors
          if (error.code !== "ENOENT") {
            console.error(`Failed to clean up ${file}:`, error.message)
          }
        }),
      )
    }
    await Promise.all(promises)
  }
}
