import { randomUUID } from "node:crypto"
import { mkdirSync } from "node:fs"
import { relative } from "node:path"
import { DatabaseSync } from "node:sqlite"
import type { StyleGuide } from "./types.js"

export class DB {
  private database: DatabaseSync
  runId: string

  constructor(dbPath: string, existingRunId?: string) {
    // Create directory if needed (for file-based databases)
    if (dbPath !== ":memory:") {
      const dir = dbPath.substring(0, dbPath.lastIndexOf("/"))
      if (dir) {
        mkdirSync(dir, { recursive: true })
      }

      process.on("exit", () => this.close())
      process.on("SIGINT", () => this.close())
      process.on("SIGTERM", () => this.close())
    }

    this.runId = existingRunId || randomUUID()
    this.database = new DatabaseSync(dbPath)

    this.init()
  }

  init = (): void => {
    // Create tables if they don't exist
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        result TEXT NOT NULL,
        created_at DATETIME NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_responses_lookup ON responses(run_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS style_guides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        language TEXT NOT NULL,
        content TEXT NOT NULL,
        directory TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_style_guides_lookup ON style_guides(run_id, language, directory);
    `)
  }

  saveResponse = (result: string): void => {
    const stmt = this.database.prepare("INSERT INTO responses (run_id, result, created_at) VALUES (?, ?, ?)")
    stmt.run(this.runId, result, new Date().toISOString())
  }

  saveStyleGuide = (language: string, content: string, directory: string): void => {
    const now = new Date().toISOString()

    // Check if style guide exists for this language and directory in current run
    const existing = this.database
      .prepare("SELECT id FROM style_guides WHERE run_id = ? AND language = ? AND directory = ?")
      .get(this.runId, language, directory) as { id: number } | undefined

    if (existing) {
      // Update existing
      const stmt = this.database.prepare("UPDATE style_guides SET content = ?, updated_at = ? WHERE id = ?")
      stmt.run(content, now, existing.id)
    } else {
      // Insert new
      const stmt = this.database.prepare(
        "INSERT INTO style_guides (run_id, language, content, directory, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      stmt.run(this.runId, language, content, directory, now, now)
    }
  }

  getStyleGuide = (language: string, directory: string): StyleGuide | null => {
    const stmt = this.database.prepare(
      "SELECT * FROM style_guides WHERE run_id = ? AND language = ? AND directory = ? ORDER BY updated_at DESC LIMIT 1",
    )
    const row = stmt.get(this.runId, language, directory) as
      | {
          id: number
          run_id: string
          language: string
          content: string
          directory: string
          created_at: string
          updated_at: string
        }
      | undefined

    if (!row) return null

    return {
      id: row.id,
      project_path: row.directory,
      language: row.language,
      content: row.content,
      created_at: row.created_at,
    }
  }

  getChildStyleGuides = (parentDirectory: string, language: string): Array<{ directory: string; content: string }> => {
    const stmt = this.database.prepare(
      `SELECT directory, content FROM style_guides
       WHERE run_id = ? AND language = ? AND directory LIKE ?
       AND directory != ?
       ORDER BY directory`,
    )
    const rows = stmt.all(this.runId, language, `${parentDirectory}/%`, parentDirectory) as Array<{
      directory: string
      content: string
    }>

    // Filter to only immediate children (no additional slashes after parent)
    const immediateChildren = rows.filter(row => {
      const relativePath = row.directory.slice(parentDirectory.length + 1)
      return !relativePath.includes("/")
    })

    return immediateChildren.map(row => ({
      directory: relative(parentDirectory, row.directory),
      content: row.content,
    }))
  }

  close = (): void => {
    if (this.database?.isOpen) {
      this.database.close()
    }
  }
}
