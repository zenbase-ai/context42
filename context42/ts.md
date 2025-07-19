---
description: TypeScript Style Guide
globs: "**/*.ts"
alwaysApply: false
---

# TypeScript Style Guide: The Zenbase-AI Developer's Unified DNA

This guide synthesizes the core coding philosophy and architectural patterns observed across the Zenbase-AI codebase, revealing the developer's complete decision-making framework. It aims to capture not just *what* they code, but *how* they think, enabling an AI agent to seamlessly mimic their style.

## 1. CORE PHILOSOPHY

The developer's fundamental beliefs revolve around **clarity, maintainability, and robust, type-safe code**. They prioritize **modularity** and **explicit state/resource management**, balancing **functional patterns** with **object-oriented structures** where appropriate. Performance is a key consideration, especially in React contexts and CLI operations where resource usage is critical. The code feels intentional, with a strong emphasis on explicit contracts (types) and predictable state/resource flow.

**Key Principles:**
*   **Explicit Contracts:** Define clear interfaces and types for all data structures and function signatures.
*   **Modularity & Separation of Concerns:** Break down problems into small, focused modules, each with distinct responsibilities.
*   **Explicit State & Resource Management:** Manage mutable state locally and encapsulate resources (e.g., database connections, temporary files) diligently.
*   **Performance-Awareness:** Proactive use of memoization (`useMemo`, `useCallback`) in React and efficient data structures/concurrency in core logic.
*   **Defensive Design:** Validate inputs and handle potential errors gracefully, providing clear feedback.
*   **Readability over Obscurity:** Code is structured for easy understanding, with logical grouping and minimal, high-value comments.
*   **Testability:** Design choices actively facilitate unit testing with minimal setup.
*   **Resilience:** Errors are anticipated and handled gracefully, preventing crashes.
*   **Predictability:** Code should behave as expected, even in edge cases.

**Example (Modularity & Resource Management):**
The `CleanupRegistry` and `DB` classes exemplify explicit resource management and modularity, centralizing concerns.
```typescript
// src/lib/cleanup-registry.ts
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
}

// src/lib/database.ts
export class DB {
  private database: Database.Database
  runId: string

  constructor(dbPath: string, existingRunId?: string) {
    // ...
    process.on("exit", () => this.close())
    process.on("SIGINT", () => this.close())
    process.on("SIGTERM", () => this.close())
  }
  // ...
}
```

## 2. NAMING PATTERNS

The developer employs a consistent and descriptive naming strategy, making code highly readable and self-documenting across the codebase.

*   **`camelCase` for variables, functions, methods, and class properties:**
    *   **Example:**
        ```typescript
        const [progress, setProgress] = useState(0) // React state
        const run = useCallback(async () => { /* ... */ }) // React method
        createStyleGuideProcessor({ /* ... */ }) // Function
        saveResponse(result: string): void { /* ... */ } // Class method
        ```
    *   **Anti-Example (avoid `snake_case` or `PascalCase` for these):**
        ```typescript
        const my_variable = 0 // Avoid
        const MyFunction = () => { /* ... */ } // Avoid
        ```
    *   **Rationale:** Standard JavaScript/TypeScript convention, promoting immediate recognition.

*   **`PascalCase` for Types, Interfaces, and Classes:**
    *   **Example:**
        ```typescript
        type UseProcessorOptions = ProcessorOptions & { /* ... */ }
        type FileGroup = /* ... */
        export class DB { /* ... */ }
        ```
    *   **Anti-Example (avoid `camelCase` or `kebab-case` for types/classes):**
        ```typescript
        type useProcessorOptions = { /* ... */ } // Avoid
        type file-group = { /* ... */ } // Avoid
        ```
    *   **Rationale:** Clearly distinguishes type/class definitions from runtime values, enhancing readability.

*   **`is` prefix for Boolean state variables:**
    *   **Example:**
        ```typescript
        const [isRunning, setIsRunning] = useState(false)
        private isShuttingDown = false
        ```
    *   **Anti-Example (avoid generic names for booleans):**
        ```typescript
        const [running, setRunning] = useState(false) // Less clear
        ```
    *   **Rationale:** Improves clarity by immediately indicating the boolean nature of the variable.

*   **`use` prefix for custom React Hooks:**
    *   **Example:**
        ```typescript
        export const useProcessor = (options: UseProcessorOptions): UseProcessorResult => { /* ... */ }
        ```
    *   **Anti-Example (avoid non-`use` prefixes for hooks):**
        ```typescript
        export const getProcessor = () => { /* ... */ } // Not a hook
        ```
    *   **Rationale:** Adheres to React's convention for hooks, allowing static analysis tools to enforce rules of hooks and making the component's lifecycle explicit.

*   **`kebab-case` for file names:**
    *   **Example:** `use-processor.ts`, `cleanup-registry.ts`, `explorer.ts`
    *   **Rationale:** Consistent with common web development practices for file names in Node.js/TypeScript projects.

*   **Test Descriptions:** Descriptive strings are used for `describe` and `test` blocks, clearly stating the functionality being tested.
    *   **Example:**
        ```typescript
        // cleanup-registry.test.ts
        test("calls all registered handlers on cleanup", async () => { /* ... */ })
        ```
        ```typescript
        // database.test.ts
        test("getChildStyleGuides returns only immediate children (one level deep)", () => { /* ... */ })
        ```
    *   **Anti-Example (Not Used):** `test("cleanup", () => { ... })` (Too generic, lacks specific intent)

*   **Test Variables:** Variables specific to tests often include `test` in their name.
    *   **Example:**
        ```typescript
        // database.test.ts
        let testDb: DB
        const createTestDatabase = (): DB => { /* ... */ }
        ```
        ```typescript
        // cleanup-registry.test.ts
        const testDir = join(tmpdir(), `context42-test-${Date.now()}`)
        ```
    *   **Rationale:** Clearly distinguishes test-specific instances from production code, enhancing readability within test files.

## 3. CODE ORGANIZATION

The developer structures code with a strong emphasis on modularity, clear boundaries, and logical grouping within files and directories.

*   **Modular File Structure:**
    *   **Pattern:** Core logic and types reside in `src/lib`, while custom React hooks are centralized in `src/hooks`. Test files mirror the source structure in a `test/` directory.
    *   **Example:**
        ```
        src/
        ├── cli.ts
        ├── index.tsx
        ├── main.tsx
        ├── components/
        │   └── ...
        ├── hooks/
        │   └── use-processor.ts // Custom React hooks
        └── lib/
            ├── cleanup-registry.ts  // Core utility
            ├── database.ts          // Core utility
            └── types.ts             // Shared types
        test/
        ├── cleanup-registry.test.ts
        ├── database.test.ts
        └── explorer.test.ts
        ```
    *   **Rationale:** Separates reusable, non-React-specific logic and type definitions from React components/hooks, promoting reusability and reducing coupling. Promotes discoverability, maintainability, and clear boundaries between different parts of the system.

*   **Import Statement Ordering:**
    *   **Pattern:** Imports are grouped by origin and sorted alphabetically within groups.
    *   **Order:** Node.js built-ins, then external libraries, then internal modules, then type imports. Relative paths are used for internal imports.
    *   **Example:**
        ```typescript
        // src/lib/processor.ts
        import { mkdir, rename, unlink } from "node:fs/promises" // Node.js built-ins
        import { join } from "node:path"
        import { sum } from "es-toolkit" // External library
        import PQueue from "p-queue"
        import { cleanupRegistry, createFileCleanupHandler } from "./cleanup-registry.js" // Internal modules
        import { generateStyleGuide } from "./generator.js"
        import type { FileGroup, Language, Processor, ProcessorOptions, QueuedTask, Worker, WorkerUpdate } from "./types.js" // Type imports
        ```
    *   **Rationale:** Provides a consistent visual structure for dependencies, making it easy to scan and understand external vs. internal dependencies and preventing merge conflicts.

*   **In-File Structure (within Hooks and Modules):**
    *   **Pattern:** Logical sectioning with comments and state declarations grouped at the top. Consistent 2-space indentation. Blank lines separate logical blocks within functions and between test cases.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        // State
        const [progress, setProgress] = useState(0)
        const [results, setResults] = useState<Map<Language, string> | null>(null)
        // ...

        // Create processor instance
        const processor = useMemo(() => /* ... */)
        // ...

        // Run method
        const run = useCallback(async () => { /* ... */ })
        // ...
        ```
        ```typescript
        // cleanup-registry.test.ts
        describe("CleanupRegistry", () => {
        	beforeEach(() => {
        		cleanupRegistry.reset()
        	})

        	afterEach(() => {
        		cleanupRegistry.reset()
        	})
        })
        ```
    *   **Rationale:** Improves readability by visually segmenting different concerns within a single hook or module, making it easier to navigate and understand. Enhances visual rhythm and readability.

*   **Module Responsibility:** Each module (file) has a single, well-defined purpose.
    *   `cleanup-registry`: Manages cleanup handlers.
    *   `database`: Handles SQLite interactions.
    *   `explorer`: Discovers and groups files.
    *   `generator`: Interfaces with the Gemini model for style guide generation.
    *   `processor`: Orchestrates the entire style guide generation workflow.
    *   **Rationale:** Reduces cognitive load, makes code easier to navigate, and minimizes side effects.

## 4. ERROR HANDLING

The developer adopts a pragmatic and robust approach to error handling, focusing on explicit validation, graceful degradation, and clear communication of error states.

*   **Explicit Input Validation:**
    *   **Pattern:** Check for required options at the beginning of critical methods.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        const run = useCallback(async () => {
          if (!fileGroups || !inputDir || !outputDir) {
            setError("Missing required options: fileGroups, inputDir, or outputDir")
            return
          }
          // ...
        })
        ```
    *   **Rationale:** Prevents runtime errors by catching invalid inputs early, providing immediate and actionable feedback.

*   **`try...catch` for Asynchronous Operations:**
    *   **Pattern:** Wrap `await` calls in `try...catch` blocks to handle potential rejections. Errors are often logged to `console.error`.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        try {
          const styleGuides = await processor.run({ fileGroups, inputDir, outputDir })
          setResults(styleGuides)
        } catch (err) {
          setError(err instanceof Error ? err.message : "An unknown error occurred")
        } finally {
          setIsRunning(false)
        }

        // src/lib/cleanup-registry.ts
        unlink(file).catch((error) => {
            // Ignore file not found errors
            if (error.code !== "ENOENT") {
                console.error(`Failed to clean up ${file}:`, error.message)
            }
        })
        ```
    *   **Rationale:** Ensures that asynchronous failures are caught and managed, preventing unhandled promise rejections and allowing the application to recover or display an error message. Specific error codes (e.g., `ENOENT`) are sometimes checked for graceful handling.

*   **Centralized Error State Management (in React):**
    *   **Pattern:** Use a dedicated state variable (`error`) to store and expose error messages in React components/hooks.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        const [error, setError] = useState<string | null>(null)
        // ...
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        ```
    *   **Rationale:** Provides a single source of truth for error status, simplifying error display and handling in the UI.

*   **Defensive Programming:** Input validation and checks for invalid states are present.
    *   **Example:**
        ```typescript
        // generator.test.ts
        test("generateStyleGuide throws error for empty files", async () => {
          await expect(
            generateStyleGuide({
              files: [] as string[],
              model: "gemini-2.5-pro",
              language: "typescript",
            }),
          ).rejects.toThrow("No typescript files found to analyze")
        })
        ```
        ```typescript
        // cleanup-registry.test.ts
        test("prevents multiple cleanup calls", async () => {
        	let callCount = 0
        	cleanupRegistry.register(() => callCount++)
        	await cleanupRegistry.cleanup()
        	await cleanupRegistry.cleanup() // Subsequent calls have no effect
        	expect(callCount).toBe(1)
        })
        ```
    *   **Rationale:** Prevents unexpected behavior and provides clear feedback when preconditions are not met.

## 5. STATE MANAGEMENT

The developer embraces localized state management, minimizing global mutable state and leveraging efficient data structures.

*   **Local Component/Module State:**
    *   **Pattern:** All mutable state within a hook is managed using `useState`. In core utilities, state is encapsulated within classes or module closures.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        const [progress, setProgress] = useState(0)
        const [results, setResults] = useState<Map<Language, string> | null>(null)

        // src/lib/database.ts
        export class DB {
          private database: Database.Database
          runId: string
          // ...
        }
        ```
    *   **Rationale:** Keeps state encapsulated within its specific context, making it easier to reason about and test, and reducing the risk of unintended side effects.

*   **Immutable State Updates:**
    *   **Pattern:** When updating array or object state, always create a new instance rather than mutating the existing one.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        setWorkers(previousWorkers => previousWorkers.map(w => (w.id === updatedWorker.id ? updatedWorker : w)))
        ```
    *   **Anti-Example (avoid direct mutation):**
        ```typescript
        // let workers = [...]
        // workers[index] = updatedWorker; setWorkers(workers) // Avoid direct mutation
        ```
    *   **Rationale:** Essential for React's reconciliation process to detect changes and trigger re-renders efficiently.

*   **`Map` and `Set` for Key-Value Collections:**
    *   **Pattern:** Uses `Map` for collections where keys are distinct and efficient lookups are beneficial, and `Set` for unique collections.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        fileGroups?: Map<Language, FileGroup[]>
        results: Map<Language, string> | null

        // src/lib/cleanup-registry.ts
        private handlers = new Set<CleanupHandler>()
        ```
    *   **Rationale:** Provides better performance for frequent additions, deletions, and lookups compared to plain objects or arrays when uniqueness or specific key-value relationships are important.

*   **Isolated Test State:** Database instances (`DB`) are created in-memory for each test, ensuring complete isolation and preventing test interference.
    *   **Example:**
        ```typescript
        // database.test.ts
        beforeEach(() => {
          testDb = new DB(":memory:")
          testDb.init()
        })
        afterEach(() => {
          testDb.close()
        })
        ```
    *   **Rationale:** Guarantees test reliability and reproducibility by eliminating shared state side effects.

*   **Controlled Global/Singleton State:** The `cleanupRegistry` appears to be a globally accessible singleton, but its state is managed through explicit `reset()` and `cleanup()` methods.
    *   **Example:**
        ```typescript
        // cleanup-registry.test.ts
        beforeEach(() => {
        	cleanupRegistry.reset()
        })
        afterEach(() => {
        	cleanupRegistry.reset()
        })
        ```
    *   **Rationale:** For necessary global resources, provides a clear lifecycle and mechanism to prevent unintended state accumulation or interference.

## 6. API DESIGN

The developer's API design focuses on clear input/output contracts, strong typing, and functional stability.

*   **Clear Input/Output Types:**
    *   **Pattern:** Define explicit `Options` and `Result` types for custom hooks and use type definitions extensively for function parameters and return types.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        type UseProcessorOptions = ProcessorOptions & { /* ... */ }
        type UseProcessorResult = { /* ... */ }
        export const useProcessor = (options: UseProcessorOptions): UseProcessorResult => { /* ... */ }

        // src/lib/explorer.ts
        export const explorer = async (options: ExplorerOptions): Promise<Map<Language, FileGroup[]>> => { /* ... */ }
        ```
    *   **Rationale:** Enhances type safety, provides excellent IDE support, and acts as clear documentation for API consumers.

*   **Stable Function References with `useCallback` (in React):**
    *   **Pattern:** Memoize callback functions that are passed down to child components or used in dependency arrays of other hooks.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        const run = useCallback(async () => { /* ... */ }, [processor, fileGroups, inputDir, outputDir])
        const reset = useCallback(() => { /* ... */ }, [processor])
        ```
    *   **Rationale:** Prevents unnecessary re-renders of child components and avoids infinite loops when functions are part of dependency arrays, crucial for React performance.

*   **Memoized Expensive Computations with `useMemo` (in React):**
    *   **Pattern:** Memoize the creation of complex objects or results of expensive computations.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        const processor = useMemo(
          () => createStyleGuideProcessor({ /* ... */ }),
          [model, concurrency, inputDir, onWorkerUpdate, options.database],
        )
        ```
    *   **Rationale:** Optimizes performance by ensuring that instances are only re-created when their dependencies change, avoiding redundant work.

*   **Explicit Exports:**
    *   **Pattern:** Public APIs are exposed via `export const` for functions and `export class` for classes.
    *   **Example:**
        ```typescript
        // src/lib/explorer.ts
        export const explorer = async (options: ExplorerOptions): Promise<Map<Language, FileGroup[]>> => { /* ... */ }
        // src/lib/database.ts
        export class DB { /* ... */ }
        ```
    *   **Rationale:** Promotes clear module boundaries and makes it easy to identify the public interface of a module.

*   **Explicit Parameters:** Functions and constructors clearly define their required inputs.
    *   **Example:**
        ```typescript
        // processor.test.ts
        const processor = createStyleGuideProcessor({
          model: "test-model",
          concurrency: 4,
          inputDir: "/test/dir",
          database,
        })
        ```
    *   **Rationale:** Improves readability and makes it clear what data a function operates on, reducing implicit dependencies.

*   **Asynchronous Operations with Callbacks:** Long-running processes (like style guide generation) expose callbacks for progress updates and worker status.
    *   **Example:**
        ```typescript
        // processor.test.ts
        const processor = createStyleGuideProcessor({
          // ...
          onProgress: current => {
            progressUpdates.push({ current, total: 3 })
          },
          onWorkerUpdate: worker => {
            workerUpdates.push({
              id: worker.id,
              status: worker.status,
              error: worker.error,
            })
          },
        })
        ```
    *   **Rationale:** Provides a mechanism for UI feedback and monitoring of background tasks, enhancing user experience for long-running operations.

*   **Factory Functions:** Functions like `createStyleGuideProcessor` are used to construct complex objects, abstracting their internal setup.
    *   **Example:**
        ```typescript
        // processor.test.ts
        const processor = createStyleGuideProcessor({ /* ... */ })
        ```
    *   **Rationale:** Encapsulates object creation logic, making it easier to instantiate and manage complex components.

## 7. TESTING APPROACH

The developer has a comprehensive and disciplined testing philosophy, heavily relying on unit tests with extensive mocking to ensure isolation and thorough coverage.

*   **Unit Testing with Vitest:** Vitest is the chosen testing framework, with `describe` and `test` blocks structuring the test suite.
    *   **Example:**
        ```typescript
        // cleanup-registry.test.ts
        describe("CleanupRegistry", () => {
        	test("registers and unregisters handlers", () => { /* ... */ })
        	test("calls all registered handlers on cleanup", async () => { /* ... */ })
        })
        ```
    *   **Rationale:** Provides a fast and efficient way to verify individual units of code.

*   **Aggressive Mocking:** External dependencies (Node.js built-ins like `fs/promises`, and internal modules like `generator`) are extensively mocked using `vi.mock`.
    *   **Example:**
        ```typescript
        // cleanup-registry.test.ts
        vi.mock("node:fs/promises", async (importOriginal) => {
        	const actual = await importOriginal<typeof import("node:fs/promises")>()
        	return {
        		...actual,
        		unlink: vi.fn(actual.unlink),
        	}
        })
        ```
        ```typescript
        // processor.test.ts
        vi.mock("../src/lib/generator", () => ({
          generateStyleGuide: vi.fn(async ({ language, childStyleGuides, onProgress }) => { /* ... */ }),
        }))
        ```
    *   **Rationale:** Isolates the unit under test, preventing external factors from influencing test results and making tests more reliable and faster.

*   **Test Setup and Teardown:** `beforeEach` and `afterEach` hooks are consistently used to set up and clean up test environments, ensuring each test runs in a clean state.
    *   **Example:**
        ```typescript
        // database.test.ts
        beforeEach(() => {
          testDb = new DB(":memory:")
          testDb.init()
        })
        afterEach(() => {
          testDb.close()
        })
        ```
    *   **Rationale:** Prevents test pollution and ensures test independence.

*   **Coverage of Edge Cases and Errors:** Tests explicitly cover error scenarios (e.g., file permission errors, generation failures) and edge cases (e.g., non-existent files, empty inputs, multiple cleanup calls).
    *   **Example:**
        ```typescript
        // cleanup-registry.test.ts
        test("createFileCleanupHandler ignores non-existent files", async () => { /* ... */ })
        test("processor handles errors gracefully", async () => { /* ... */ })
        ```
    *   **Rationale:** Ensures the system is robust and behaves predictably under various conditions.

*   **Behavioral Verification:** `expect` assertions are used to verify not just return values, but also side effects and interactions (e.g., `toHaveBeenCalledWith`, `not.toHaveBeenCalled`).
    *   **Example:**
        ```typescript
        // cleanup-registry.test.ts
        expect(consoleSpy).toHaveBeenCalledWith("Cleanup handler error:", expect.any(Error))
        ```
        ```typescript
        // processor.test.ts
        expect(vi.mocked(rename)).toHaveBeenCalledWith(
          "/test/lib/style.ts.md",
          "/test/output/ts.md"
        )
        ```
    *   **Rationale:** Provides confidence that the code interacts correctly with its dependencies and performs its intended actions.

## 8. PERFORMANCE PATTERNS

Performance is a clear priority, especially within the React context and for CLI operations, achieved through strategic memoization, efficient data structures, and concurrency management.

*   **Aggressive Memoization of Functions and Objects (in React):**
    *   **Pattern:** Use `useCallback` for all functions that are stable across renders and `useMemo` for objects that are expensive to create.
    *   **Example (functions):** `run`, `reset` in `useProcessor`.
    *   **Example (objects):** `processor` instance in `useProcessor`.
    *   **Rationale:** Prevents unnecessary re-renders of child components and avoids re-running expensive computations, leading to a more performant and responsive UI.

*   **Dependency Array Discipline (in React):**
    *   **Pattern:** Carefully manage dependency arrays for `useMemo` and `useCallback` to ensure correct memoization and avoid stale closures.
    *   **Example:** `[model, concurrency, inputDir, onWorkerUpdate, options.database]` for `processor` memoization.
    *   **Rationale:** Crucial for the correctness and efficiency of memoization.

*   **Efficient Data Structures:**
    *   **Pattern:** Utilize `Map` and `Set` for collections where efficient lookups, additions, or uniqueness are required.
    *   **Example:** `filesByExtension` (Map), `allDirectories` (Set) in `explorer.ts`.
    *   **Rationale:** Optimizes memory usage and access times, crucial for processing large datasets.

*   **Concurrency Management:**
    *   **Pattern:** Employ libraries like `p-queue` for managing concurrent asynchronous operations.
    *   **Example:** `const q = new PQueue({ concurrency })` in `processor.ts`.
    *   **Rationale:** Optimizes execution time by parallelizing tasks while controlling resource consumption.

*   **File Size Checks:**
    *   **Pattern:** Perform checks on file sizes before processing to avoid excessive memory usage or long processing times for very large files.
    *   **Example:**
        ```typescript
        // src/lib/explorer.ts
        const { size } = await stat(file)
        if (size > 512 * 1024) continue // Skip files larger than 0.5MB
        ```
    *   **Rationale:** Prevents performance bottlenecks and potential crashes when dealing with large inputs.

*   **Topological Sorting for Dependencies:** The `explorer` module includes a `toposort` function that processes deeper directories (children) before their parents.
    *   **Example:**
        ```typescript
        // explorer.test.ts
        test("toposort processes deeper directories first", () => {
          // ...
          expect(helpersIndex).toBeLessThan(libIndex) // helpers before lib
          expect(libIndex).toBeLessThan(srcIndex) // lib before src
          // ...
        })
        ```
    *   **Rationale:** Ensures that dependencies (e.g., child style guides providing context for parent directories) are available when needed, potentially optimizing the generation process and ensuring correctness.

## 9. ANTI-PATTERNS

Based on the provided code, the developer actively avoids several common anti-patterns, prioritizing clarity, maintainability, and testability.

*   **Global Mutable State (Uncontrolled):** While `cleanupRegistry` is globally accessible, its state is explicitly managed with `reset()` and `cleanup()`. Uncontrolled global mutable state is avoided.
    *   **Anti-Example (Not Used):** Direct modification of global variables without clear lifecycle or reset mechanisms.
    *   **Rationale:** Prevents unpredictable behavior, makes debugging difficult, and hinders test isolation.

*   **Direct State Mutation:**
    *   **Avoided Pattern:** Modifying state objects or arrays directly.
    *   **Evidence:** `setWorkers(previousWorkers => previousWorkers.map(...))` instead of `workers.push(...)` or `workers[index] = ...`.
    *   **Rationale:** Prevents subtle bugs related to React's shallow comparison for re-renders and ensures predictable state updates. Also applies to general object/array manipulation.

*   **Tight Coupling:** Dependencies are passed explicitly (e.g., `database` to `createStyleGuideProcessor`), avoiding hardcoded dependencies within modules.
    *   **Anti-Example (Not Used):** Modules directly importing and instantiating their dependencies without a mechanism for injection or mocking.
    *   **Rationale:** Promotes modularity, testability, and flexibility for future changes.

*   **Magic Strings/Numbers:** While not explicitly shown as an anti-pattern, the use of `Language` enum/type suggests a preference for type-safe identifiers over raw strings where appropriate. Constants like `DEFAULT_IGNORE` are used.
    *   **Anti-Example (Implicitly Avoided):** Using raw string literals for languages or other key identifiers without type safety or constants.
    *   **Rationale:** Reduces typos, improves readability, and enables compile-time checks.

*   **Uncaught Asynchronous Errors:** All asynchronous operations are either explicitly handled with `try...catch` or are part of a system that logs/reports errors.
    *   **Anti-Example (Not Used):** Fire-and-forget asynchronous calls that could lead to unhandled promise rejections.
    *   **Rationale:** Ensures application stability and provides clear visibility into runtime issues.

*   **Deeply Nested Callbacks (Callback Hell):**
    *   **Avoided Pattern:** Excessive nesting of asynchronous callbacks.
    *   **Evidence:** Promises and `async/await` are consistently preferred for asynchronous flows, leading to flatter, more readable code.
    *   **Rationale:** Improves readability and maintainability of asynchronous logic.

## 10. DECISION TREES

The developer's choices reveal clear decision criteria for various coding scenarios, reflecting a balance between React best practices, Node.js idioms, and general software engineering principles.

*   **When to use `useState` vs. `useMemo` vs. `useCallback` (in React Hooks):**
    *   **`useState`:**
        *   **Criteria:** When managing mutable state that changes over time and triggers re-renders.
        *   **Example:** `progress`, `results`, `error`, `isRunning`, `queuedTasks`.
    *   **`useMemo`:**
        *   **Criteria:** When creating an expensive object or computing a value that should only be re-calculated when its dependencies change.
        *   **Example:** `processor` instance.
    *   **`useCallback`:**
        *   **Criteria:** When defining a function that needs a stable reference across renders (e.g., passed as a prop to a memoized child component, or used in a dependency array of other hooks).
        *   **Example:** `run`, `reset` methods in `useProcessor`.

*   **When to use `class` vs. `export const` function (for module exports):**
    *   **`class`**:
        *   **Criteria:** For entities that manage internal state, have multiple related methods, or require instantiation (e.g., `DB`, `CleanupRegistry`).
    *   **`export const` function**:
        *   **Criteria:** For pure functions, utility functions, or single-purpose operations that don't require internal state (e.g., `createFileCleanupHandler`, `explorer`, `getDirectoriesForProcessing`).

*   **When to use `Set` vs. `Array` vs. `Map` for collections:**
    *   **`Set`**:
        *   **Criteria:** When managing unique collections of items and efficient membership testing is needed.
        *   **Example:** `CleanupRegistry.handlers`, `allDirectories` in `explorer`.
    *   **`Array`**:
        *   **Criteria:** For ordered collections where duplicates are allowed or iteration order is critical.
        *   **Example:** `promises`, `files` in `FileGroup`.
    *   **`Map`**:
        *   **Criteria:** For key-value collections where keys are distinct and efficient lookups are beneficial.
        *   **Example:** `filesByExtension` in `explorer`, `fileGroups` in `useProcessor`.

*   **When to use `node:fs/promises` vs. `node:fs` (synchronous):**
    *   **`node:fs/promises`**:
        *   **Criteria:** Preferred for file system operations to avoid blocking the event loop, especially in long-running processes or CLI tools.
        *   **Example:** `unlink`, `stat`, `mkdir`, `rename` in `lib/processor.ts` and `lib/explorer.ts`.
    *   **`node:fs` (synchronous)**:
        *   **Criteria:** Used sparingly, typically for initial setup or where blocking is acceptable and simplicity is prioritized (e.g., creating directories in a constructor).
        *   **Example:** `mkdirSync` in `DB` constructor.

*   **When to Validate Inputs:**
    *   **Criteria:** Always validate inputs for critical functions or methods that rely on external data, especially before performing expensive or irreversible operations.
    *   **Example:** `run` method in `useProcessor` validates `fileGroups`, `inputDir`, `outputDir` before calling `processor.run`.
    *   **Rationale:** Prevents unexpected behavior and provides clear error messages.

*   **When to use `async/await` vs. Callbacks:**
    *   **Decision:** Prefer `async/await` for sequential asynchronous operations and clearer error propagation. Use callbacks for progress reporting or event-driven patterns where multiple updates are expected over time.
    *   **Criteria:**
        *   **`async/await`:** When a sequence of asynchronous steps needs to be executed, and the result of one step is needed for the next, or when a single final result is expected.
        *   **Callbacks (`onProgress`, `onWorkerUpdate`):** When continuous updates or multiple events need to be emitted from a long-running process, typically for UI feedback or monitoring.
    *   **Example (`async/await`):**
        ```typescript
        // cleanup-registry.test.ts
        test("calls all registered handlers on cleanup", async () => {
        	// ...
        	await cleanupRegistry.cleanup()
        	// ...
        })
        ```
    *   **Example (Callbacks):**
        ```typescript
        // processor.test.ts
        const processor = createStyleGuideProcessor({
          // ...
          onProgress: current => { /* ... */ },
          onWorkerUpdate: worker => { /* ... */ },
        })
        ```

*   **When to Mock vs. Use Real Dependencies in Tests:**
    *   **Decision:** Aggressively mock external dependencies (file system, network, other modules) for unit tests to ensure isolation. Use real dependencies only for integration or end-to-end tests where the interaction between components is the primary focus.
    *   **Criteria:**
        *   **Mock:** When testing a single unit's logic, and its dependencies are complex, slow, or have side effects (e.g., file system, database, API calls).
        *   **Real:** When testing the interaction between multiple integrated components or the system's behavior as a whole.
    *   **Example (Mocking `fs/promises`):**
        ```typescript
        // cleanup-registry.test.ts
        vi.mock("node:fs/promises", async (importOriginal) => { /* ... */ })
        ```
    *   **Example (Using real `DB` in `database.test.ts`):**
        ```typescript
        // database.test.ts
        let testDb: DB // Real DB instance for database tests
        beforeEach(() => {
          testDb = new DB(":memory:")
          testDb.init()
        })
        ```

*   **When to Create a New Module/File:**
    *   **Decision:** Create a new module when a distinct set of related functionalities or a single, well-defined responsibility emerges.
    *   **Criteria:**
        *   **Single Responsibility Principle:** If a piece of code has more than one reason to change, it should likely be split.
        *   **Reusability:** If a set of functions or a class could be useful in other parts of the application.
        *   **Testability:** If extracting functionality into its own module makes it easier to unit test in isolation.
    *   **Example:** `cleanup-registry.js`, `database.js`, `explorer.js`, `generator.js`, `processor.js` are all separate modules due to their distinct responsibilities.
    *   **Anti-Example (Not Used):** A single large file containing all application logic.

## 11. AI AGENT INSTRUCTIONS

To mimic the Zenbase-AI developer's coding style, an AI agent should follow these guidelines, synthesizing insights from both React-specific and core utility patterns.

### 11.1. Pre-Flight Checklist

1.  **Review Relevant Existing Code:** Before writing any new code, thoroughly examine existing files in the same module or directory. Pay close attention to how similar problems are solved, especially regarding React component/hook patterns versus core utility patterns.
2.  **Identify Abstraction Level:** Determine the appropriate level of abstraction. Is the new code a low-level utility (likely `src/lib`), a reusable hook (likely `src/hooks`), or a component-specific implementation?
3.  **Check Naming Conventions:** Scan existing code for naming patterns for variables, functions, types, and files. Ensure consistency with `camelCase`, `PascalCase`, `kebab-case`, and React-specific prefixes (`use`, `is`).
4.  **Determine Error Handling Approach:** Understand how errors are typically handled in the surrounding code (e.g., `try...catch`, state variables for errors, input validation, specific error code handling).
5.  **Consider Performance vs. Readability:** Evaluate if the new code involves potentially expensive computations or frequent re-renders in a React context. If so, plan for memoization (`useMemo`, `useCallback`) and efficient data structures.

### 11.2. Writing Process

1.  **Problem Decomposition:** Break down the problem into logical, manageable units. If it's a React feature, consider if a custom hook is appropriate for encapsulating logic and state. For core logic, aim for small, focused modules.
2.  **Apply Naming Patterns:**
    *   Use `camelCase` for variables, functions, and methods.
    *   Use `PascalCase` for types, interfaces, and classes.
    *   Prefix custom React hooks with `use`.
    *   Prefix boolean state variables with `is`.
    *   Use `kebab-case` for new file names.
3.  **Structure Code:**
    *   Organize files logically (e.g., hooks in `src/hooks`, core utilities in `src/lib`).
    *   Order imports: Node.js built-ins first, then external modules, then internal modules, then type imports.
    *   Within files (especially hooks), use comments to delineate logical sections (e.g., `// State`, `// Methods`).
    *   Group state declarations at the top of hooks.
4.  **Implement Error Handling:**
    *   Add explicit input validation for critical functions.
    *   Wrap asynchronous operations in `try...catch` blocks or chain with `.catch()`.
    *   Use a dedicated state variable to expose error messages in React contexts.
    *   Handle specific error codes gracefully where appropriate.
5.  **Manage State:**
    *   Use `useState` for all local mutable state in hooks.
    *   Ensure all state updates are immutable (create new arrays/objects).
    *   Encapsulate state within classes or module closures for core utilities.
    *   Consider `Map` and `Set` for efficient key-value or unique collections.
6.  **Optimize Performance (React & Core):**
    *   Use `useCallback` for stable function references.
    *   Use `useMemo` for memoizing expensive object creations or computations.
    *   Be precise with dependency arrays for `useCallback` and `useMemo`.
    *   Employ `PQueue` for concurrency and `Promise.all` for parallel asynchronous operations in core logic.
    *   Implement file size checks or other resource-saving measures where applicable.
7.  **Add Comments Sparingly:** Add sparse, high-value comments to explain *why* a section exists or *what* a complex piece of logic does, matching the existing single-line comment style.
8.  **Write Tests First (or Concurrently):** Develop comprehensive unit tests alongside the code, using Vitest, aggressive mocking, and `beforeEach`/`afterEach` for isolation. Ensure tests cover happy paths, edge cases, and error scenarios.

### 11.3. Review Criteria

1.  **Belonging:** Does the new code "feel" like it belongs in this codebase? Does it seamlessly integrate with existing patterns, both React-specific and core utility patterns?
2.  **Naming Consistency:** Are all naming patterns (variables, functions, types, files) consistent with the established conventions?
3.  **Abstraction Appropriateness:** Is the abstraction level suitable for the context? Is core logic separated from React concerns?
4.  **Error Handling Adherence:** Does the error handling strategy match established patterns (validation, `try...catch`, error state, specific error handling)?
5.  **Performance Optimization:** Are `useMemo` and `useCallback` used effectively where performance is a concern? Are dependency arrays correct? Are efficient data structures and concurrency patterns used in core logic?
6.  **Readability:** Is the code clear, concise, and easy to understand, with proper spacing and indentation?
7.  **Developer Emulation:** Would the original developer make the same choices regarding structure, naming, error handling, state management, and performance?
8.  **Modularity:** Is the code modular and does it have clear responsibilities?
9.  **Test Coverage:** Are there comprehensive unit tests that cover the new functionality, including happy paths, edge cases, and error scenarios, with appropriate mocking?