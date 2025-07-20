---
description: ts Style Guide
globs: "**/*.ts"
alwaysApply: false
---

# TypeScript Style Guide: Decoding the Developer's DNA

This guide captures the unique coding DNA of the developer, enabling AI agents to produce contributions indistinguishable from the original author. It focuses on the "how" and "why" behind the code, not just the "what."

## 1. CORE PHILOSOPHY

The developer prioritizes **clarity, testability, modularity, reusability, and performance**. Code is designed to be easily understood, independently verifiable, and composed of well-defined, single-responsibility units. There's a strong emphasis on predictable state management, robust error handling, and efficient resource management to ensure application stability and performance. Performance is a first-class citizen, particularly for I/O-bound tasks, but not at the expense of code readability or maintainability.

**Rationale:** This approach leads to a codebase that is resilient, maintainable, scalable, and performant, reducing cognitive load, preventing common pitfalls, and ensuring reliable resource utilization.

**Examples:**

*   **Clarity & Modularity (across `src/lib` and `test`):**
    ```typescript
    // src/lib/cleanup-registry.ts
    class CleanupRegistry { /* ... */ }
    export const cleanupRegistry = new CleanupRegistry()
    ```
    ```typescript
    // test/cleanup-registry.test.ts
    import { cleanupRegistry, createFileCleanupHandler } from "../src/lib/cleanup-registry.js"
    describe("CleanupRegistry", () => { /* ... */ })
    ```
    *   **NOT:** A single large utility file containing all cleanup, database, and file exploration logic.
    *   **Rationale:** Separates concerns into distinct modules, making each easier to understand, test, and maintain. This clear separation enhances maintainability and allows for easier independent development and testing of different application layers.

*   **Testability & Predictable Behavior (evident in `test` files):**
    ```typescript
    // test/database.test.ts
    beforeEach(() => {
      testDb = new DB(":memory:") // In-memory DB for isolated tests
      testDb.init()
    })

    afterEach(() => {
      testDb.close() // Ensures clean state after each test
    })
    ```
    *   **NOT:** Relying on a persistent database or shared global state that could lead to test interference.
    *   **Rationale:** Guarantees that each test runs in a clean, isolated environment, preventing flaky tests and making failures easier to diagnose.

*   **Robust Error Handling (across `src/lib` and `test`):**
    ```typescript
    // src/lib/cleanup-registry.ts
    unlink(file).catch(error => {
      if (error.code !== "ENOENT") {
        console.error(`Failed to clean up ${file}:`, error.message)
      }
    })
    ```
    ```typescript
    // test/cleanup-registry.test.ts
    test("createFileCleanupHandler logs non-ENOENT errors", async () => {
      // ... mock unlink to throw ...
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const files = new Set(["/some/file.md"])
      const handler = createFileCleanupHandler(files)
      await handler()
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to clean up /some/file.md:",
        "Permission denied"
      )
      consoleSpy.mockRestore()
    })
    ```
    *   **NOT:** Ignoring potential errors or letting exceptions crash the application without specific handling or logging.
    *   **Rationale:** Ensures that the application remains stable even when unexpected issues (like permission errors) occur, providing clear feedback for debugging.

## 2. NAMING PATTERNS

The developer employs a consistent and descriptive naming strategy, prioritizing clarity and context across both application and test code.

*   **Camel Case for Variables, Functions, and Instances:**
    *   **Pattern:** `camelCase` for local variables, function names, and instances of classes.
    *   **Rationale:** Standard JavaScript/TypeScript convention, enhances readability.
    *   **Examples:**
        ```typescript
        // src/lib/processor.ts
        const [progress, setProgress] = useState(0)
        const run = useCallback(async () => { /* ... */ })
        ```
        ```typescript
        // test/cleanup-registry.test.ts
        let called = false
        const handler = () => { /* ... */ }
        ```
    *   **Anti-Example:** `Progress_Value`, `RUN_PROCESSOR`, `test_db`.

*   **Pascal Case for Classes, Types, and Interfaces:**
    *   **Pattern:** `PascalCase` for class definitions, interfaces, and custom types.
    *   **Rationale:** Clear distinction between types/interfaces and runtime values, aligning with common TypeScript practices.
    *   **Examples:**
        ```typescript
        // src/lib/types.ts
        export type FileGroup = { /* ... */ }
        export class DB { /* ... */ }
        ```
        ```typescript
        // test/database.test.ts
        let testDb: DB
        ```
    *   **Anti-Example:** `use_processor_options`, `worker`.

*   **Boolean Variables:** Prefixed with `is` or `has`.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        const [isRunning, setIsRunning] = useState(false)
        ```
    *   **Anti-Example:** `processorRunning`.
    *   **Rationale:** Improves readability by immediately indicating a boolean type.

*   **File Naming:**
    *   **React Hooks:** `kebab-case` prefixed with `use-`.
        *   **Example:** `use-processor.ts`
        *   **Rationale:** Consistent with React hook conventions, clearly identifies the file's purpose.
    *   **Library/Utility Files:** `kebab-case`.
        *   **Example:** `cleanup-registry.ts`, `database.ts`, `explorer.ts`
        *   **Rationale:** Maintains consistency with file naming conventions across the project, promoting readability and discoverability.

*   **Descriptive Prefixes/Suffixes for Test-Related Entities:**
    *   **Pattern:** `test` prefix for test-specific variables (e.g., `testDb`, `testDir`, `testPath`). `Spy` suffix for mocked console/function spies.
    *   **Rationale:** Clearly indicates the purpose and scope of variables within a testing context, improving test readability.
    *   **Examples:**
        ```typescript
        // test/database.test.ts
        let testDb: DB
        ```
        ```typescript
        // test/cleanup-registry.test.ts
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
        ```
    *   **Anti-Example:** Generic names like `db`, `directory`, `spy` that lack context.

*   **Clear and Concise Function/Method Names:**
    *   **Pattern:** Verbs or verb phrases that clearly describe the action performed (e.g., `saveResponse`, `getChildStyleGuides`, `createFileCleanupHandler`, `generateStyleGuide`, `createStyleGuideProcessor`).
    *   **Rationale:** Improves code readability and makes the intent of the function immediately obvious.
    *   **Examples:**
        ```typescript
        // src/lib/database.ts
        this.database.prepare("INSERT INTO responses (run_id, result, created_at) VALUES (?, ?, ?)")
        ```
        ```typescript
        // test/cleanup-registry.test.ts
        const handler = createFileCleanupHandler(files)
        ```
    *   **Anti-Example:** Ambiguous names like `processData`, `handleStuff`, or `doWork`.

## 3. CODE ORGANIZATION

The codebase exhibits a strong commitment to modularity, clear separation of concerns, and a logical file structure, consistently applied across both application and test code.

*   **Feature-Based Module Organization:**
    *   **Pattern:** Core functionalities are encapsulated within distinct modules (e.g., `cleanup-registry`, `database`, `explorer`, `generator`, `processor`) under a `src/lib` directory. Each module focuses on a single, well-defined responsibility. UI-specific logic (React hooks) resides in a `hooks` directory.
    *   **Rationale:** Promotes high cohesion and low coupling, making modules easier to develop, test, and maintain independently. It also facilitates understanding the system's architecture at a glance.
    *   **Examples:**
        ```
        // Project structure implies:
        src/
        ├── hooks/
        │   └── use-processor.ts
        └── lib/
            ├── cleanup-registry.ts
            ├── database.ts
            └── explorer.ts
        test/
        ├── cleanup-registry.test.ts
        ├── database.test.ts
        └── explorer.test.ts
        ```
    *   **Anti-Example:** A monolithic `utils.ts` file containing unrelated functions, or scattering related logic across many unrelated files.

*   **Dedicated Test Files per Module:**
    *   **Pattern:** Each source module (`.ts` in `src/lib` or `src/hooks`) has a corresponding test file (`.test.ts`) in the `test/` directory.
    *   **Rationale:** Ensures comprehensive testing for each functional unit and makes it easy to locate tests for a specific piece of code.
    *   **Examples:**
        ```typescript
        // test/cleanup-registry.test.ts tests ../src/lib/cleanup-registry.ts
        import { cleanupRegistry, createFileCleanupHandler } from "../src/lib/cleanup-registry.js"
        ```
        ```typescript
        // test/database.test.ts tests ../src/lib/database.ts
        import { DB } from "../src/lib/database"
        ```
    *   **Anti-Example:** A single `all.test.ts` file for all tests, or tests embedded directly within source files.

*   **Consistent Import Ordering:**
    *   **Pattern:** Imports are grouped logically: Node.js built-in modules, then external libraries, then local relative imports, and finally type-only imports. Each group is typically separated by a blank line. Within groups, imports are generally ordered alphabetically.
    *   **Rationale:** Provides a predictable and clean structure for dependencies, making it easy to scan and understand what external resources a file relies on.
    *   **Examples:**
        ```typescript
        // src/cli.ts
        import { homedir } from "node:os" // Node.js built-in
        import { cancel, intro, isCancel, multiselect, outro, spinner, text } from "@clack/prompts" // External libraries
        import { cleanupRegistry } from "./lib/cleanup-registry.js" // Local relative
        import type { FileGroup, Language } from "./lib/types.js" // Type-only
        ```
        ```typescript
        // test/cleanup-registry.test.ts
        import { existsSync } from "node:fs" // Node.js built-in
        import { describe, test, expect, beforeEach, afterEach, vi } from "vitest" // External libraries
        import { cleanupRegistry, createFileCleanupHandler } from "../src/lib/cleanup-registry.js" // Local relative
        ```
    *   **Anti-Example:** Random import order, or mixing different types of imports without clear separation.

*   **Code Spacing and Indentation:**
    *   **Indentation:** 2 spaces.
    *   **Spacing:** Consistent spacing around operators, after commas, and within object literals.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        const { model, concurrency, inputDir, onWorkerUpdate, fileGroups, outputDir } = options
        const [progress, setProgress] = useState(0)
        ```
    *   **Anti-Example:** `const {model,concurrency,inputDir}=options`, `const [ progress,setProgress ] = useState ( 0 )`.
    *   **Rationale:** Enhances visual clarity and readability, contributing to a consistent codebase appearance.

*   **Bracket Placement:**
    *   **Opening Brace:** On the same line as the declaration (K&R style).
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        export const useProcessor = (options: UseProcessorOptions): UseProcessorResult => {
          // ...
        }
        ```
    *   **Anti-Example:** Opening brace on a new line.
    *   **Rationale:** Common JavaScript/TypeScript convention, compacts code vertically.

*   **Logical Grouping within Files (especially tests):**
    *   **Pattern:** Within test files, `describe` blocks group related tests, and `beforeEach`/`afterEach` hooks are used for setup/teardown. Individual `test` blocks are concise and focus on a single assertion or scenario.
    *   **Rationale:** Improves readability and navigability within a file, making it easier to understand the scope and purpose of different test cases.
    *   **Examples:**
        ```typescript
        // test/cleanup-registry.test.ts
        describe("CleanupRegistry", () => {
            beforeEach(() => { /* ... */ })
            afterEach(() => { /* ... */ })
            test("registers and unregisters handlers", () => { /* ... */ })
        })
        ```
    *   **Anti-Example:** Long, sprawling test functions that test multiple unrelated aspects, or inconsistent use of setup/teardown hooks.

## 4. ERROR HANDLING

The developer employs a robust and explicit error handling strategy, focusing on graceful recovery, clear logging, and preventing application crashes, applied consistently across UI and core logic.

*   **Asynchronous Error Handling with `try...catch`:**
    *   **Pattern:** Asynchronous operations that can fail are consistently wrapped in `try...catch` blocks to ensure graceful error recovery and prevent unhandled promise rejections.
    *   **Rationale:** Ensures that errors in one part of an asynchronous flow do not propagate and crash the application, allowing for specific error responses or fallback mechanisms.
    *   **Examples:**
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
        ```
        ```typescript
        // src/lib/generator.ts
        try {
          // ... async operation
        } catch (error) {
          throw new Error(`Gemini command failed: ${stderr || errorMessage}`)
        }
        ```
    *   **Anti-Example:** Ignoring `Promise` rejections or using `.catch()` without specific error handling logic.

*   **State-Based Error Reporting (UI Layer):**
    *   **Pattern:** In the UI layer (hooks and components), errors are stored in a dedicated state variable (`error`) for display and management.
    *   **Rationale:** Centralizes error reporting for the UI, making it easy to react to and display error messages to the user.
    *   **Examples:**
        ```typescript
        // src/hooks/use-processor.ts
        const [error, setError] = useState<string | null>(null)
        setError("Missing required options: fileGroups, inputDir, or outputDir")
        ```
    *   **Anti-Example:** UI components performing complex error validation that should be handled by business logic.

*   **Early Input Validation:**
    *   **Pattern:** Critical inputs are validated at the beginning of functions or hooks to prevent operations with invalid data and provide immediate feedback.
    *   **Rationale:** Fails fast, preventing unnecessary computation and providing immediate feedback on missing requirements, improving user experience and debugging.
    *   **Examples:**
        ```typescript
        // src/hooks/use-processor.ts
        const run = useCallback(async () => {
          if (!fileGroups || !inputDir || !outputDir) {
            setError("Missing required options: fileGroups, inputDir, or outputDir")
            return
          }
        }, [processor, fileGroups, inputDir, outputDir])
        ```
        ```typescript
        // src/lib/generator.ts
        if (files.length === 0) {
          throw new Error(`No ${language} files found to analyze`)
        }
        ```
    *   **Anti-Example:** Proceeding with empty arrays or null inputs, leading to potential runtime errors later.

*   **Granular Error Handling (Core Logic):**
    *   **Pattern:** In core logic (`lib`), errors are often handled with more granularity, sometimes ignoring specific, non-critical errors (e.g., `ENOENT` for file cleanup) or providing more detailed error messages.
    *   **Rationale:** Allows for more robust and resilient core logic by distinguishing between recoverable and critical errors, preventing unnecessary crashes for expected conditions.
    *   **Examples:**
        ```typescript
        // src/lib/cleanup-registry.ts
        unlink(file).catch(error => {
          if (error.code !== "ENOENT") {
            console.error(`Failed to clean up ${file}:`, error.message)
          }
        })
        ```
        ```typescript
        // src/lib/generator.ts
        if (stderr.includes("rate limit")) {
          throw new Error("Gemini API rate limit exceeded. Exponential backoff failed. Please wait and try again.")
        }
        ```
    *   **Anti-Example:** Treating all errors uniformly, or logging "file not found" errors when the intention is to delete a file that might already be gone.

## 5. STATE MANAGEMENT

State management is primarily localized and explicit, with clear mechanisms for isolation and controlled mutation, especially in testing contexts.

*   **React Hooks for Local State (UI Layer):**
    *   **Pattern:** `useState` is used for managing component-local state variables within React components and hooks. `useMemo` and `useCallback` are used for memoization of expensive computations/objects and function definitions respectively.
    *   **Rationale:** Standard React practice for managing mutable state within functional components, ensuring reactivity and proper component updates while optimizing performance.
    *   **Examples:**
        ```typescript
        // src/hooks/use-processor.ts
        const [progress, setProgress] = useState(0)
        const processor = useMemo(() => createStyleGuideProcessor({ /* ... */ }), [/* ... */])
        const run = useCallback(async () => { /* ... */ }, [/* ... */])
        ```
    *   **Anti-Example:** Direct mutation of props or state objects without using setter functions or creating new objects.

*   **Internal State Management (Core Logic):**
    *   **Pattern:** In core logic (`lib`), internal state is managed using class properties (for object-oriented structures like `DB` or `CleanupRegistry`) or via closures (for functional patterns like `createStyleGuideProcessor`).
    *   **Rationale:** Provides appropriate state management mechanisms for non-React contexts, ensuring data encapsulation and predictable behavior within core modules.
    *   **Examples:**
        ```typescript
        // src/lib/cleanup-registry.ts
        class CleanupRegistry {
          private handlers = new Set<CleanupHandler>()
          private isShuttingDown = false
        }
        ```
        ```typescript
        // src/lib/processor.ts
        export const createStyleGuideProcessor = (options: ProcessorOptions): Processor => {
          const workers: Worker[] = Array.from({ length: options.concurrency }, (_, index) => ({ /* ... */ }))
          let total: number | undefined
        }
        ```
    *   **Anti-Example:** Uncontrolled global variables or singletons that can be mutated by any part of the application without clear mechanisms for reset or isolation.

*   **Explicit State Reset/Cleanup for Test Isolation:**
    *   **Pattern:** For modules that manage global or shared state (like `cleanupRegistry` or a database connection), explicit `reset()` or `close()` methods are provided and consistently used in test `beforeEach`/`afterEach` hooks.
    *   **Rationale:** Ensures that each test runs with a clean slate, preventing state leakage between tests and making tests reliable and deterministic.
    *   **Examples:**
        ```typescript
        // test/cleanup-registry.test.ts
        beforeEach(() => { cleanupRegistry.reset() })
        afterEach(() => { cleanupRegistry.reset() })
        ```
        ```typescript
        // test/database.test.ts
        beforeEach(() => { testDb = new DB(":memory:"); testDb.init() })
        afterEach(() => { testDb.close() })
        ```
    *   **Anti-Example:** Relying on garbage collection or implicit state cleanup, which can lead to flaky tests.

*   **Data Isolation for Concurrent/Multiple Runs:**
    *   **Pattern:** The `DB` implementation supports data isolation for different "runs" or instances, even when using the same underlying database path (e.g., `:memory:`). This implies a mechanism to scope data to a specific execution context.
    *   **Rationale:** Critical for systems that process data in parallel or in distinct logical "runs," ensuring that one operation's data does not interfere with another's.
    *   **Examples:**
        ```typescript
        // test/database.test.ts
        test("run isolation - different runs have isolated data", () => {
          const dbPath = ":memory:"
          const db1 = new DB(dbPath); db1.init()
          db1.saveStyleGuide("typescript", "First Run Style Guide", "/project")
          const db2 = new DB(dbPath); db2.init()
          db2.saveStyleGuide("typescript", "Second Run Style Guide", "/project")
          expect(db1.getStyleGuide("typescript", "/project")?.content).toBe("First Run Style Guide")
          expect(db2.getStyleGuide("typescript", "/project")?.content).toBe("Second Run Style Guide")
        })
        ```
    *   **Anti-Example:** Using a single, shared global state that is mutated by concurrent operations without proper locking or isolation mechanisms.

## 6. API DESIGN

The developer designs APIs that are clear, extensible, and easy to use, favoring configuration objects for complex functions and descriptive naming, and utilizing event-driven communication for progress updates.

*   **Configuration Objects for Function Parameters:**
    *   **Pattern:** Functions with multiple parameters, especially those that might grow over time, accept a single object as an argument. This object contains named properties for each parameter.
    *   **Rationale:** Improves readability by making parameter names explicit at the call site, allows for optional parameters without complex overload signatures, and makes functions more extensible without breaking existing calls.
    *   **Examples:**
        ```typescript
        // src/lib/explorer.ts
        export const explorer = async (options: ExplorerOptions): Promise<Map<Language, FileGroup[]>> => { /* ... */ }
        ```
        ```typescript
        // src/lib/processor.ts
        export const createStyleGuideProcessor = (options: ProcessorOptions): Processor => { /* ... */ }
        ```
    *   **Anti-Example:** Functions with many positional arguments, which can be hard to read and maintain.

*   **Descriptive Function and Method Names:**
    *   **Pattern:** Function and method names clearly convey their purpose and action (e.g., `saveStyleGuide`, `getChildStyleGuides`, `createFileCleanupHandler`, `getDirectoriesForProcessing`, `toposort`).
    *   **Rationale:** Enhances code readability and makes the API self-documenting, reducing the need for extensive comments.
    *   **Examples:**
        ```typescript
        // src/lib/database.ts
        testDb.saveStyleGuide("typescript", "# Parent Guide", "/project")
        ```
        ```typescript
        // src/lib/explorer.ts
        export const toposort = (fileGroups: Map<Language, FileGroup[]>): Map<Language, FileGroup[]> => { /* ... */ }
        ```
    *   **Anti-Example:** Vague names like `process`, `handle`, or `get`.

*   **Clear Return Values and Type Definitions:**
    *   **Pattern:** Functions return meaningful values, and types/interfaces are used to define the structure of complex return objects (e.g., `FileGroup`, `Language`, `ProcessorResult`).
    *   **Rationale:** Provides strong contracts for API consumers, enabling type checking and improving code predictability.
    *   **Examples:**
        ```typescript
        // src/lib/types.ts
        export type FileGroup = { /* ... */ }
        export type Processor = ProcessorState & { /* ... */ }
        ```
        ```typescript
        // src/lib/database.ts
        const retrieved = testDb.getStyleGuide(language, directory) // Returns StyleGuide | null
        ```
    *   **Anti-Example:** Returning `any` or `void` when a specific structure is expected, or relying solely on implicit type inference for complex data.

*   **Event-Driven Communication for Progress/Status Updates:**
    *   **Pattern:** For long-running operations or processes with internal state changes, callbacks (`onProgress`, `onWorkerUpdate`, `onQueueUpdate`) are used to communicate updates to the caller.
    *   **Rationale:** Decouples the core logic from UI or logging concerns, allowing for flexible integration and real-time feedback without blocking the main thread.
    *   **Examples:**
        ```typescript
        // src/lib/processor.ts
        const processor = createStyleGuideProcessor({
          // ...
          onProgress: current => { /* ... */ },
          onWorkerUpdate: worker => { /* ... */ },
          onQueueUpdate: queuedTasks => { /* ... */ },
        })
        ```
    *   **Anti-Example:** Returning a single final result after a long delay, or using synchronous polling for status updates.

## 7. TESTING APPROACH

The developer demonstrates a highly disciplined and comprehensive testing philosophy, prioritizing unit isolation, edge case coverage, and clear test semantics, consistently using `vitest` and its mocking capabilities.

*   **Unit Testing with `vitest` and Mocks:**
    *   **Philosophy:** Every significant function or module is subjected to rigorous unit testing. The `vitest` framework is the tool of choice, with heavy reliance on its mocking capabilities (`vi.mock`, `vi.spyOn`).
    *   **Rationale:** Ensures that individual units of code function correctly in isolation, making it easier to pinpoint bugs and refactor with confidence.
    *   **Examples:**
        ```typescript
        // test/cleanup-registry.test.ts
        vi.mock("node:fs/promises", async (importOriginal) => {
            const actual = await importOriginal<typeof import("node:fs/promises")>()
            return { ...actual, unlink: vi.fn(actual.unlink) }
        })
        test("createFileCleanupHandler removes files", async () => { /* ... */ })
        ```
        ```typescript
        // test/processor.test.ts
        vi.mock("../src/lib/generator", () => ({
          generateStyleGuide: vi.fn(async ({ language, childStyleGuides, onProgress }) => { /* ... */ }),
        }))
        test("processor processes file groups", async () => { /* ... */ })
        ```
    *   **Anti-Example:** Relying on integration tests for basic functionality, or testing units with their real dependencies.

*   **Clear Test Descriptions and Structure:**
    *   **Philosophy:** Test descriptions (`test("...")`) are highly descriptive, often outlining the exact scenario or behavior being verified. Tests are grouped logically using `describe` blocks.
    *   **Rationale:** Improves test suite readability, making it easy to understand the purpose of each test and what functionality it covers.
    *   **Examples:**
        ```typescript
        // test/cleanup-registry.test.ts
        describe("CleanupRegistry", () => {
            test("registers and unregisters handlers", () => { /* ... */ })
            test("calls all registered handlers on cleanup", async () => { /* ... */ })
        })
        ```
        ```typescript
        // test/database.test.ts
        test("getChildStyleGuides returns only immediate children (one level deep)", () => { /* ... */ })
        ```
    *   **Anti-Example:** Vague test names like `test("it works")` or `test("functionality")`.

*   **Comprehensive Edge Case and Error Path Testing:**
    *   **Philosophy:** Explicit tests are written for error conditions, invalid inputs, and edge cases (e.g., non-existent files, empty arrays, permission errors, multiple cleanup calls).
    *   **Rationale:** Ensures the robustness and reliability of the code under various circumstances, preventing unexpected crashes or incorrect behavior.
    *   **Examples:**
        ```typescript
        // test/cleanup-registry.test.ts
        test("createFileCleanupHandler ignores non-existent files", async () => { /* ... */ })
        test("processor handles errors gracefully", async () => { /* ... */ })
        ```
    *   **Anti-Example:** Only testing happy paths, leaving error handling untested.

*   **Resource Management and Isolation in Tests:**
    *   **Philosophy:** `beforeEach` and `afterEach` hooks are consistently used to set up and tear down test-specific resources (e.g., in-memory databases, resetting global registries, creating/deleting temporary directories).
    *   **Rationale:** Guarantees that tests are independent and do not affect each other, leading to a stable and reliable test suite.
    *   **Examples:**
        ```typescript
        // test/database.test.ts
        beforeEach(() => { testDb = new DB(":memory:"); testDb.init() })
        afterEach(() => { testDb.close() })
        ```
    *   **Anti-Example:** Leaving resources open or relying on the test runner's default cleanup, which can lead to resource leaks or test interference.

*   **Verification of Interactions (Spies):**
    *   **Philosophy:** `vi.spyOn` is used to verify that functions or methods are called with the correct arguments, or that certain side effects (like console logging) occur.
    *   **Rationale:** Essential for testing interactions between units and ensuring that mocked dependencies are used as expected.
    *   **Examples:**
        ```typescript
        // test/cleanup-registry.test.ts
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
        expect(consoleSpy).toHaveBeenCalledWith("Cleanup handler error:", expect.any(Error))
        ```
        ```typescript
        // test/processor.test.ts
        expect(vi.mocked(generateStyleGuide)).toHaveBeenCalledWith(expect.objectContaining({
            childStyleGuides: { lib: "# Lib Style Guide", components: "# Components Style Guide" },
        }))
        ```
    *   **Anti-Example:** Only asserting on return values, missing verification of side effects or interactions.

## 8. PERFORMANCE PATTERNS

Performance considerations are evident in the design, particularly around I/O-bound operations and data processing, favoring concurrency and optimized data structures.

*   **Concurrency for I/O-Bound Tasks:**
    *   **Pattern:** The `processor` module explicitly uses a `concurrency` option to distribute work across multiple "workers" (simulated by concurrent `generateStyleGuide` calls). This allows multiple style guide generations to happen in parallel.
    *   **Rationale:** Significantly speeds up operations that involve waiting for external resources (like file system access or API calls to a language model), by utilizing available CPU cores or I/O bandwidth.
    *   **Examples:**
        ```typescript
        // test/processor.test.ts
        const processor = createStyleGuideProcessor({
          model: "test-model",
          concurrency: 3, // Explicit concurrency limit
          inputDir: testPath("dir"),
          database,
          onWorkerUpdate: worker => { /* ... track active workers ... */ },
        })
        // Asserts that maxConcurrentWorkers > 1 and respects the limit
        expect(maxConcurrentWorkers).toBeGreaterThan(1)
        ```
    *   **Anti-Example:** Processing all files sequentially, which would be much slower for large codebases.

*   **Topological Sorting for Dependency Resolution:**
    *   **Pattern:** The `explorer` module includes a `toposort` function that orders directories based on their dependencies (deeper directories before their parents). This ensures that child style guides are generated and available before their parent directories are processed.
    *   **Rationale:** Prevents redundant work and ensures that the generation process has all necessary context (child style guides) when processing a parent directory. This is a form of dependency-aware optimization.
    *   **Examples:**
        ```typescript
        // test/explorer.test.ts
        test("toposort processes deeper directories first", () => {
          // ... fileGroups with hierarchy ...
          const sorted = toposort(fileGroups)
          const directories = sorted.get("ts")?.map(g => g.directory)
          expect(helpersIndex).toBeLessThan(libIndex) // helpers before lib
        })
        ```
        ```typescript
        // test/processor.test.ts
        test("processor respects directory dependencies - children processed before parents", async () => {
          // ... asserts on processingOrder ...
          expect(libIndex).toBeLessThan(srcIndex)
        })
        ```
    *   **Anti-Example:** Processing directories in an arbitrary order, which could lead to missing context or requiring multiple passes.

*   **Efficient Data Structures:**
    *   **Pattern:** Uses `Map` for key-value lookups (e.g., `fileGroupsMap` by language, `workerTaskMap` by worker ID) and `Set` for unique collections (e.g., `files` in `createFileCleanupHandler`, `activeWorkers`).
    *   **Rationale:** These data structures provide efficient lookup and manipulation operations, which are important for performance in data-intensive tasks.
    *   **Examples:**
        ```typescript
        // src/lib/explorer.ts
        const filesByExtension = new Map<string, string[]>()
        ```
        ```typescript
        // src/lib/cleanup-registry.ts
        private handlers = new Set<CleanupHandler>()
        ```
    *   **Anti-Example:** Using arrays for frequent lookups or uniqueness checks, which can lead to `O(n)` operations.

## 9. ANTI-PATTERNS

The developer actively avoids certain practices, indicating a preference for maintainable, predictable, and robust code.

*   **Avoidance of Global Mutable State (without control):**
    *   **Anti-Pattern:** Uncontrolled global variables or singletons that can be mutated by any part of the application without clear mechanisms for reset or isolation.
    *   **Rationale:** Leads to unpredictable behavior, makes testing difficult due to inter-test dependencies, and introduces hidden side effects.
    *   **Examples (what is avoided, implied by current patterns):**
        *   **NOT:** A single, globally accessible `db` object that is not reset between tests, or a `cleanupRegistry` that cannot be cleared.
        *   **Instead:** `cleanupRegistry` has a `reset()` method, and `DB` instances are created per test or per "run" with in-memory databases to ensure isolation.

*   **Avoidance of Unhandled Asynchronous Errors:**
    *   **Anti-Pattern:** Neglecting to handle `Promise` rejections or asynchronous errors, leading to unhandled promise rejections and potential application crashes.
    *   **Rationale:** Unhandled errors can bring down the application, make debugging extremely difficult, and lead to a poor user experience.
    *   **Examples (what is avoided, implied by current patterns):**
        *   **NOT:** Asynchronous functions that throw errors without being wrapped in `try...catch` or having a `.catch()` handler.
        *   **Instead:** Explicit `try...catch` blocks and logging for errors in asynchronous cleanup handlers and processor tasks.

*   **Avoidance of Ambiguous Naming:**
    *   **Anti-Pattern:** Using generic, non-descriptive names for variables, functions, or modules (e.g., `data`, `process`, `handler`).
    *   **Rationale:** Reduces code readability, makes it harder to understand the purpose of code without deep inspection, and increases cognitive load.
    *   **Examples (what is avoided, implied by current patterns):**
        *   **NOT:** `function process(d)`
        *   **Instead:** `function getChildStyleGuides(directory, language)` or `const createFileCleanupHandler(files)`.

*   **Avoidance of Monolithic Files/Functions:**
    *   **Anti-Pattern:** Creating excessively large files or functions that handle multiple, unrelated responsibilities.
    *   **Rationale:** Decreases maintainability, makes code harder to test, and increases the risk of introducing bugs when making changes.
    *   **Examples (what is avoided, implied by current patterns):**
        *   **NOT:** A single `main.ts` file that contains all database logic, file system operations, and style guide generation.
        *   **Instead:** Clear module boundaries for `cleanup-registry`, `database`, `explorer`, `generator`, and `processor`.

*   **Avoidance of Direct DOM Manipulation (UI Layer):**
    *   **Anti-Pattern:** Directly manipulating the DOM outside of React's declarative paradigm.
    *   **Rationale:** Breaks React's component model, leads to unpredictable UI states, and makes debugging difficult.
    *   **Examples (what is avoided, implied by current patterns):**
        *   **NOT:** Using `document.getElementById` or similar methods within React components.
        *   **Instead:** Relying on React's state and props to manage UI updates.

*   **Avoidance of Unmanaged Resources:**
    *   **Anti-Pattern:** Leaving resources (like database connections or temporary files) unmanaged, leading to leaks or unexpected behavior.
    *   **Rationale:** Ensures proper system resource utilization and prevents long-term issues.
    *   **Examples (what is avoided, implied by current patterns):**
        *   **NOT:** Opening database connections without closing them, or creating temporary files without a cleanup mechanism.
        *   **Instead:** Implementing explicit `DB.close()` and `cleanupRegistry` for temporary files.

## 10. DECISION TREES

This section outlines the implicit decision-making criteria observed in the developer's code.

*   **When to Create a New Module/File:**
    *   **Criteria:** When a new distinct functional area or a significant set of related responsibilities emerges. If a set of functions or a class can operate largely independently and serves a specific, cohesive purpose, it warrants its own module.
    *   **Decision:** Create a new file in `src/lib/` (e.g., `database.ts`, `explorer.ts`) for core logic, or `src/hooks/` for reusable UI logic (e.g., `use-processor.ts`).
    *   **Example:**
        *   **Scenario:** Need to manage cleanup handlers for temporary resources.
        *   **Decision:** Create `cleanup-registry.ts` to encapsulate this logic.
        *   **Anti-Example:** Adding cleanup logic directly into `processor.ts` or a generic `utils.ts`.

*   **When to Use a Configuration Object for Function Parameters:**
    *   **Criteria:** When a function requires more than 2-3 parameters, or when parameters are optional, or when the function's interface is likely to evolve with new parameters in the future.
    *   **Decision:** Define an interface or type for the configuration object and pass it as a single argument.
    *   **Example:**
        *   **Scenario:** `createStyleGuideProcessor` needs `model`, `concurrency`, `inputDir`, `database`, and optional callbacks.
        *   **Decision:** Use `{ model, concurrency, inputDir, database, onProgress, onWorkerUpdate }` as a single parameter.
        *   **Anti-Example:** `createStyleGuideProcessor("test-model", 4, "/path/to/input", myDb, myProgressCallback, myWorkerUpdateCallback)`.

*   **When to Mock a Dependency in Tests:**
    *   **Criteria:** Always, for external modules (Node.js built-ins like `fs/promises`) and internal modules that are not the direct unit under test. If the test's purpose is to verify the logic *within* the current module, its dependencies should be mocked to ensure isolation.
    *   **Decision:** Use `vi.mock` at the module level or `vi.spyOn` for specific methods.
    *   **Example:**
        *   **Scenario:** Testing `createFileCleanupHandler` which calls `unlink` from `node:fs/promises`.
        *   **Decision:** Mock `node:fs/promises` to control `unlink`'s behavior and prevent actual file system operations during tests.
        *   **Anti-Example:** Allowing `unlink` to perform real file system operations, making tests slow, dependent on the environment, and potentially leaving artifacts.

*   **When to Log an Error vs. Throw an Error:**
    *   **Criteria:**
        *   **Log:** For non-critical errors in background processes or cleanup routines where the application can continue operating, but the error should be noted for debugging. Also for expected "errors" like `ENOENT` when the intent is to ensure absence.
        *   **Throw:** For critical errors that prevent the current operation from completing successfully, or for invalid inputs that indicate a programming error by the caller.
    *   **Decision:** Use `console.error` for logging, `throw new Error()` for critical failures.
    *   **Example (Log):**
        *   **Scenario:** A cleanup handler fails to delete a file due to a permission error.
        *   **Decision:** Log the error to `console.error` but allow other cleanup handlers to run.
        *   **Anti-Example:** Crashing the entire cleanup process because one file couldn't be deleted.
    *   **Example (Throw):**
        *   **Scenario:** `generateStyleGuide` is called with an empty list of files.
        *   **Decision:** Throw an error immediately, as this indicates an invalid state for the generation process.
        *   **Anti-Example:** Returning an empty string or `null` and letting downstream logic handle the empty result, which might lead to more complex errors.

*   **When to Use `Map` vs. Plain Object vs. `Set`:**
    *   **Criteria:**
        *   **`Map`:** When keys are not strictly strings (e.g., objects, numbers) or when order of insertion needs to be preserved, or when iterating over key-value pairs is common.
        *   **Plain Object:** For simple key-value pairs where keys are strings and order is not guaranteed or critical.
        *   **`Set`:** When storing a collection of unique values and efficient membership testing is required.
    *   **Decision:** Choose the data structure that best fits the data's characteristics and access patterns.
    *   **Example (`Map`):**
        *   **Scenario:** Grouping `FileGroup` objects by `Language` (string keys, but `Map` offers better iteration and explicit size).
        *   **Decision:** `Map<Language, FileGroup[]>`
    *   **Example (`Set`):**
        *   **Scenario:** Storing a collection of file paths that need to be unique and quickly checked for existence.
        *   **Decision:** `new Set(["file1.md", "file2.md"])`
        *   **Anti-Example:** Using an array and iterating over it for `includes` checks, which is less efficient for large collections.

*   **When to use `useCallback` vs. `useMemo` (UI Layer):**
    *   **`useCallback`:** Use when memoizing a function definition that is passed as a prop to a child component, or when it's a dependency of another `useEffect`, `useMemo`, or `useCallback` hook.
        *   **Criteria:** The function itself is stable across renders, and its identity matters for dependency arrays or child component re-renders.
    *   **`useMemo`:** Use when memoizing the result of an expensive computation or an object/array creation.
        *   **Criteria:** The value itself is stable across renders, and its re-computation/re-creation is costly.

*   **When to Use a Singleton Pattern:**
    *   **Criteria:** For managing global, shared resources that need a single point of control and consistent state across the application.
    *   **Decision:** Implement a class with a static instance or export a single instance directly.
    *   **Example:** `cleanupRegistry` in `cleanup-registry.ts`
    *   **Anti-Example:** Creating multiple instances of a resource that should be unique, leading to conflicts or inefficiencies.

*   **When to Implement Explicit Resource Cleanup:**
    *   **Criteria:** For external resources that are not automatically managed by the runtime, such as file handles, database connections, or temporary files.
    *   **Decision:** Provide explicit `close()` or `cleanup()` methods and ensure they are called at appropriate lifecycle points (e.g., application exit, test teardown).
    *   **Example:** `DB.close()` in `database.ts`, `createFileCleanupHandler` in `cleanup-registry.ts`.
    *   **Anti-Example:** Relying on garbage collection for external resources, which can lead to leaks or system instability.

## 11. AI AGENT INSTRUCTIONS

To mimic this developer's coding style, an AI agent should adhere to the following guidelines:

**Pre-Write Checklist:**

1.  **Contextual Immersion:** Before writing any code, thoroughly review existing TypeScript files in the same module or directory. Pay close attention to how similar problems are solved, existing abstractions, and the overall "feel" of the code.
2.  **Abstraction Level:** Identify the current abstraction level. Are you working with low-level file system operations, or higher-level business logic? Ensure your new code operates at the appropriate level. This will guide placement (e.g., `hooks` vs. `lib`).
3.  **Naming Conventions:** Scan existing code for naming patterns for variables, functions, classes, and types. Specifically note how compound words are handled (e.g., `cleanupRegistry`, `fileGroupsMap`) and if any domain-specific abbreviations are used. For files, ensure `kebab-case` (e.g., `use-hook-name.ts`, `utility-module.ts`).
4.  **Error Handling Strategy:** Determine the established error handling approach for the specific context. Should errors be logged, thrown, or handled gracefully with fallbacks? Consider granular error handling for specific conditions.
5.  **Performance vs. Readability:** Consider the trade-offs. Is this a performance-critical path where memoization, efficient algorithms, or concurrency management are justified? Or should readability and maintainability take precedence? Default to readability unless performance is a proven bottleneck.
6.  **Test Coverage:** Identify if there are existing tests for the module you are modifying or adding to. If not, plan to add comprehensive unit tests.
7.  **Resource Management Needs:** If the code interacts with external resources, plan for explicit cleanup and lifecycle management.

**Writing Process:**

1.  **Problem Decomposition:** Break down the problem into the smallest, most cohesive functional units. Each unit should ideally map to a function or a small class. Clearly separate UI concerns from core logic.
2.  **Naming Consistency:** Apply the identified naming patterns rigorously. Use `camelCase` for variables and functions, `PascalCase` for classes and types. Be descriptive and avoid ambiguity.
3.  **Code Structure and Organization:**
    *   Place new files in logical directories (e.g., `src/lib/` for core logic, `src/hooks/` for reusable UI logic, `test/` for tests).
    *   Order imports consistently: Node.js built-ins, then third-party, then local modules, then type-only imports. Use blank lines to separate groups.
    *   Use 2-space indentation and consistent spacing.
    *   Place opening curly braces on the same line as the statement (K&R style).
    *   Use blank lines to separate logical blocks of code within functions/classes.
4.  **API Design:**
    *   For functions with multiple parameters, use a single configuration object.
    *   Ensure function and method names are clear, concise verbs or verb phrases.
    *   Define types/interfaces for complex data structures and return values.
    *   Consider using callbacks for progress or status updates in long-running operations.
5.  **Error Handling Implementation:**
    *   Wrap asynchronous operations in `try...catch` blocks where failures should not halt the entire process.
    *   Log non-critical errors to `console.error` with contextual messages.
    *   Throw explicit errors for invalid inputs or critical failures that prevent successful completion.
    *   Distinguish between expected (e.g., `ENOENT`) and unexpected errors.
6.  **State Management:**
    *   For React components/hooks, use `useState`, `useMemo`, `useCallback` for local state and memoization.
    *   For core logic, manage internal state using class properties or closures as appropriate.
    *   Ensure data isolation for concurrent operations or distinct "runs."
7.  **Testing:**
    *   Write dedicated unit tests for new functionality.
    *   Use `vitest` and its mocking capabilities (`vi.mock`, `vi.spyOn`) to isolate units under test.
    *   Ensure tests cover happy paths, edge cases, and error conditions.
    *   Use `beforeEach` and `afterEach` for proper test setup and teardown, ensuring resource isolation.
    *   Write descriptive test names that explain the scenario being tested.
8.  **Comments:** Add comments sparingly, primarily to explain *why* a particular design choice was made, or to clarify complex algorithms. Avoid comments that merely restate what the code does.

**Review Criteria:**

1.  **Belonging:** Does the new code "feel" like it belongs in this codebase? Does it seamlessly integrate with existing patterns and architectural layers?
2.  **Naming Consistency:** Are all variables, functions, classes, and types named consistently with existing code across both UI and core logic? Is their purpose immediately clear from their name?
3.  **Abstraction Appropriateness:** Is the abstraction level correct for the context? Is it too low-level or too high-level? Does it respect the separation between UI and core logic?
4.  **Error Handling Adherence:** Does the error handling strategy match the established patterns for similar contexts within the codebase? Are all potential error paths considered and handled appropriately?
5.  **Developer's Choice:** Given the problem and existing patterns, would the original developer likely have made the exact same design and implementation choices regarding structure, naming, performance, error handling, and resource management?
6.  **Test Coverage & Clarity:** Are the tests comprehensive, isolated, and clearly describe the behavior being verified?
7.  **Readability:** Is the code easy to read and understand at a glance, without excessive mental effort?
8.  **Performance & Resource Management:** Are performance considerations evident (memoization, efficient algorithms, concurrency) and are resources managed explicitly and correctly?