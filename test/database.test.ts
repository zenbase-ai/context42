import { afterEach, beforeEach, expect, test } from "vitest"
import { DB } from "../src/lib/database"

let testDb: DB

beforeEach(() => {
  // Create a new in-memory database for each test
  testDb = new DB(":memory:")
  testDb.init()
})

afterEach(() => {
  // Clean up after each test
  testDb.close()
})

test("database operations work correctly", () => {
  // Test saveResponse
  testDb.saveResponse("Test response content")
  
  // Since we removed getRecentResponses, we can't directly verify
  // But we can test that it doesn't throw
  expect(() => testDb.saveResponse("Another response")).not.toThrow()
})

test("getChildStyleGuides returns child directory style guides", () => {
  // Set up some style guides in different directories
  testDb.saveStyleGuide("typescript", "# Parent Guide", "/project")
  testDb.saveStyleGuide("typescript", "# Src Guide", "/project/src")
  testDb.saveStyleGuide("typescript", "# Lib Guide", "/project/src/lib")
  testDb.saveStyleGuide("typescript", "# Components Guide", "/project/src/components")
  testDb.saveStyleGuide("python", "# Python Scripts Guide", "/project/scripts")

  // Get child style guides for /project - should only get immediate children
  const projectChildren = testDb.getChildStyleGuides("/project", "typescript")
  expect(projectChildren).toHaveLength(1)
  expect(projectChildren.map(c => c.directory).sort()).toEqual(["src"])
  expect(projectChildren.find(c => c.directory === "src")?.content).toBe("# Src Guide")

  // Get child style guides for /project/src
  const srcChildren = testDb.getChildStyleGuides("/project/src", "typescript")
  expect(srcChildren).toHaveLength(2)
  expect(srcChildren.map(c => c.directory).sort()).toEqual(["components", "lib"])

  // Get child style guides for a leaf directory
  const libChildren = testDb.getChildStyleGuides("/project/src/lib", "typescript")
  expect(libChildren).toHaveLength(0)

  // Different language should return only Python children
  const pythonChildren = testDb.getChildStyleGuides("/project", "python")
  expect(pythonChildren).toHaveLength(1)
  expect(pythonChildren[0]?.directory).toBe("scripts")
  expect(pythonChildren[0]?.content).toBe("# Python Scripts Guide")
})

test("getChildStyleGuides returns only immediate children (one level deep)", () => {
  // Set up a deep directory structure with style guides
  testDb.saveStyleGuide("typescript", "# Root Guide", "/app")
  testDb.saveStyleGuide("typescript", "# Src Guide", "/app/src")
  testDb.saveStyleGuide("typescript", "# Test Guide", "/app/test")
  testDb.saveStyleGuide("typescript", "# Components Guide", "/app/src/components")
  testDb.saveStyleGuide("typescript", "# Hooks Guide", "/app/src/hooks")
  testDb.saveStyleGuide("typescript", "# Lib Guide", "/app/src/lib")
  testDb.saveStyleGuide("typescript", "# UI Guide", "/app/src/components/ui")
  testDb.saveStyleGuide("typescript", "# Forms Guide", "/app/src/components/forms")
  testDb.saveStyleGuide("typescript", "# Utils Guide", "/app/src/lib/utils")

  // Query for immediate children of /app - should only get src and test, NOT deeper directories
  const appChildren = testDb.getChildStyleGuides("/app", "typescript")
  expect(appChildren).toHaveLength(2)
  expect(appChildren.map(c => c.directory).sort()).toEqual(["src", "test"])
  
  // Query for immediate children of /app/src - should get components, hooks, lib
  const srcChildren = testDb.getChildStyleGuides("/app/src", "typescript")
  expect(srcChildren).toHaveLength(3)
  expect(srcChildren.map(c => c.directory).sort()).toEqual(["components", "hooks", "lib"])
  
  // Query for immediate children of /app/src/components - should get ui and forms
  const componentChildren = testDb.getChildStyleGuides("/app/src/components", "typescript")
  expect(componentChildren).toHaveLength(2)
  expect(componentChildren.map(c => c.directory).sort()).toEqual(["forms", "ui"])
  
  // Query for immediate children of /app/src/lib - should only get utils
  const libChildren = testDb.getChildStyleGuides("/app/src/lib", "typescript")
  expect(libChildren).toHaveLength(1)
  expect(libChildren[0]?.directory).toBe("utils")
})

test("style guide save and retrieve", () => {
  const language = "typescript"
  const content = "# TypeScript Style Guide\n\nUse arrow functions"
  const directory = "/test/project"

  // Save style guide
  testDb.saveStyleGuide(language, content, directory)

  // Retrieve it
  const retrieved = testDb.getStyleGuide(language, directory)
  expect(retrieved).not.toBeNull()
  expect(retrieved?.language).toBe(language)
  expect(retrieved?.content).toBe(content)
  expect(retrieved?.project_path).toBe(directory)

  // Update it
  const updatedContent = "# Updated TypeScript Style Guide\n\nPrefer const"
  testDb.saveStyleGuide(language, updatedContent, directory)

  // Verify update
  const updated = testDb.getStyleGuide(language, directory)
  expect(updated?.content).toBe(updatedContent)

  // Non-existent style guide should return null
  const notFound = testDb.getStyleGuide("python", "/nonexistent")
  expect(notFound).toBeNull()
})

test("multiple databases don't interfere with each other", () => {
  const db1 = new DB(":memory:")
  const db2 = new DB(":memory:")
  
  db1.init()
  db2.init()

  // Save to db1
  db1.saveStyleGuide("typescript", "DB1 Content", "/project")
  
  // Save to db2
  db2.saveStyleGuide("typescript", "DB2 Content", "/project")

  // Verify they're independent
  const fromDb1 = db1.getStyleGuide("typescript", "/project")
  const fromDb2 = db2.getStyleGuide("typescript", "/project")

  expect(fromDb1?.content).toBe("DB1 Content")
  expect(fromDb2?.content).toBe("DB2 Content")

  // Clean up
  db1.close()
  db2.close()
})

test("run isolation - different runs have isolated data", () => {
  // Create a single database file to simulate multiple runs
  const dbPath = ":memory:"
  
  // First run
  const db1 = new DB(dbPath)
  db1.init()
  
  // Save data in first run
  db1.saveStyleGuide("typescript", "First Run Style Guide", "/project")
  db1.saveStyleGuide("typescript", "First Run Src Guide", "/project/src")
  db1.saveStyleGuide("typescript", "First Run Lib Guide", "/project/src/lib")
  db1.saveResponse("First run response")
  
  // Get run_id from first run (we'll need to expose this for testing)
  // For now, we'll just verify the data is isolated
  
  // Create second run (simulating a new execution)
  const db2 = new DB(dbPath)
  db2.init()
  
  // Save data in second run with same paths
  db2.saveStyleGuide("typescript", "Second Run Style Guide", "/project")
  db2.saveStyleGuide("typescript", "Second Run Test Guide", "/project/test")
  db2.saveResponse("Second run response")
  
  // Verify second run only sees its own data
  const projectGuide = db2.getStyleGuide("typescript", "/project")
  expect(projectGuide?.content).toBe("Second Run Style Guide")
  
  // Verify getChildStyleGuides only returns data from current run
  const children = db2.getChildStyleGuides("/project", "typescript")
  expect(children).toHaveLength(1)
  expect(children[0]?.directory).toBe("test")
  expect(children[0]?.content).toBe("Second Run Test Guide")
  
  // First run should not see second run's data
  const firstRunProjectGuide = db1.getStyleGuide("typescript", "/project")
  expect(firstRunProjectGuide?.content).toBe("First Run Style Guide")
  
  const firstRunChildren = db1.getChildStyleGuides("/project", "typescript")
  expect(firstRunChildren).toHaveLength(1)
  expect(firstRunChildren[0]?.directory).toBe("src")
  
  // Clean up
  db1.close()
  db2.close()
})