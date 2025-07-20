---
description: Project-Wide Style Guide
globs: "**/*.{ts,tsx}"
alwaysApply: false
---

# Project-Wide Style Guide: The Zenbase-AI Developer's Unified DNA

[PROGRESS] Deciphering the ancient scrolls of code, one pixel at a time...

This guide synthesizes the overarching coding philosophy and architectural patterns observed across the entire Zenbase-AI codebase. It aims to provide an AI agent with a holistic understanding of the developer's mental model, enabling contributions that are indistinguishable from the original author's, regardless of the specific file type (`.ts` or `.tsx`).

## 1. CORE PHILOSOPHY

The developer's core philosophy is built upon **clarity, maintainability, and pragmatic performance optimization, underpinned by robust type safety and diligent resource management.** This approach fosters a highly organized, predictable, and resilient codebase.

**Key Principles:**
*   **Explicit Contracts:** All data structures and function signatures are clearly defined using TypeScript interfaces and types, ensuring strong type safety and enhancing developer experience.
*   **Modularity & Separation of Concerns:** Code is meticulously organized into small, focused modules (files and directories like `components`, `hooks`, `lib`), each with a distinct responsibility. This promotes high cohesion and low coupling.
*   **Functional Purity (where applicable):** While embracing object-oriented structures for complex entities (e.g., `DB`, `CleanupRegistry`), there's a strong inclination towards pure functions and predictable state flow, especially within React components and utility functions.
*   **Performance-Awareness:** Proactive use of memoization (`useMemo`, `useCallback`) in React components and efficient data structures (`Map`, `Set`) in utilities to prevent unnecessary computations and re-renders.
*   **Defensive Design & Graceful Degradation:** Inputs are explicitly validated, and errors are handled gracefully, often by displaying error states as data in the UI or logging them, rather than crashing the application.
*   **Resource Management:** Critical resources (like database connections, temporary files) are managed diligently with explicit cleanup mechanisms.

**Rationale:** This unified philosophy ensures consistency across the entire project, leading to code that is easy to understand, extend, and debug, while maintaining high performance and reliability, crucial for both CLI tools and interactive UIs.

## 2. NAMING PATTERNS

A consistent and descriptive naming strategy is employed across the entire project, balancing clarity with conciseness.

*   **`PascalCase` for Components, Classes, Types, and Interfaces:**
    *   **Rationale:** Clearly distinguishes these structural elements from runtime values.
    *   **Examples:**
        ```typescript
        // src/components/ExplorerStatus.tsx
        export const ExplorerStatus: React.FC<ExplorerStatusProps> = ({ fileGroups, isLoading }) => { /* ... */ }

        // src/lib/database.ts
        export class DB { /* ... */ }

        // src/lib/types.ts
        export type FileGroup = { /* ... */ }
        ```

*   **`camelCase` for variables, functions, methods, and component props:**
    *   **Rationale:** Standard JavaScript/TypeScript convention, promoting immediate recognition.
    *   **Examples:**
        ```typescript
        // src/components/ExplorerStatus.tsx
        const foundLanguages = Array.from(fileGroups.keys())
        let fileCount = 0

        // src/lib/database.ts
        saveResponse(result: string): void { /* ... */ }
        ```

*   **`use` prefix for custom React Hooks:**
    *   **Rationale:** Adheres to React's convention, allowing static analysis and making the component's lifecycle explicit.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        export const useProcessor = (options: UseProcessorOptions): UseProcessorResult => { /* ... */ }
        ```

*   **`is` prefix for Boolean state variables:**
    *   **Rationale:** Improves clarity by immediately indicating the boolean nature of the variable.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        const [isRunning, setIsRunning] = useState(false)
        ```

*   **`kebab-case` for file names:**
    *   **Rationale:** Consistent with common Node.js/TypeScript project conventions for file names.
    *   **Examples:**
        ```
        src/cli.ts
        src/hooks/use-processor.ts
        src/lib/cleanup-registry.ts
        ```

*   **Prop Type Naming:** PascalCase for type names, suffixed with `Props`.
    *   **Rationale:** Clearly indicates the type definition for a component's properties.
    *   **Example:**
        ```typescript
        // src/components/ExplorerStatus.tsx
        export type ExplorerStatusProps = {
          readonly fileGroups: Map<Language, FileGroup[]>
          readonly isLoading: boolean
        }
        ```

*   **Abbreviation Usage:** Abbreviations are used sparingly and only when context is immediately obvious or for common loop variables (e.g., `DB`, `CLI`, `colI`, `ml`, `mr`).

## 3. CODE ORGANIZATION

The codebase is structured for **modularity, reusability, and clear separation of concerns**, with a consistent hierarchy and import discipline.

*   **Modular Directory Structure:**
    *   `src/`: Root for all source code.
    *   `src/components/`: Houses reusable React UI components (e.g., `ExplorerStatus.tsx`, `Table.tsx`).
    *   `src/hooks/`: Contains custom React Hooks (e.g., `use-processor.ts`).
    *   `src/lib/`: Stores core logic, utilities, and shared type definitions that are not React-specific (e.g., `database.ts`, `explorer.ts`, `types.ts`).
    *   `src/cli.ts`, `src/index.tsx`, `src/main.tsx`: Entry points and top-level application orchestration.

*   **Import Statement Organization:** Imports are consistently grouped logically:
    1.  External libraries (e.g., `react`, `ink`, `es-toolkit`, `better-sqlite3`).
    2.  Node.js built-in modules (e.g., `node:os`, `node:path`, `node:fs/promises`).
    3.  Internal relative imports, with `type` imports explicitly used and often grouped at the end of their section.
    *   **Rationale:** Improves readability and makes it easy to distinguish between different types of dependencies.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        import { useCallback, useMemo, useState } from "react" // React imports
        import { createStyleGuideProcessor } from "../lib/processor.js" // Internal modules
        import type { FileGroup, Language, Processor, ProcessorOptions, QueuedTask, Worker } from "../lib/types.js" // Type imports
        ```

*   **In-File Structure:**
    *   **Logical Sectioning:** Blank lines and comments (e.g., `// State`, `// Methods`, `/* Config */`) are used to separate logical blocks of code within files, enhancing visual rhythm and readability.
    *   **State Grouping:** In React Hooks, `useState` declarations are typically grouped at the top for an immediate overview of the hook's internal state.
    *   **Component Structure:** Functional components use React Hooks, with props destructured at the function signature. Internal helper functions are often memoized.

## 4. ERROR HANDLING

Error handling is **explicit, pragmatic, and focused on graceful degradation and clear communication of error states.**

*   **Explicit Input Validation:** Critical functions and methods perform checks for required options or valid inputs at their beginning.
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

*   **`try...catch` for Asynchronous Operations:** `await` calls are wrapped in `try...catch` blocks to handle potential rejections, ensuring that failures are caught and managed.
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
        ```

*   **Centralized Error State Management:** A dedicated state variable (e.g., `error` in `useProcessor`) is used to store and expose error messages, simplifying error display in the UI.
    *   **Example:**
        ```typescript
        // src/index.tsx
        {error != null ? (
          <Box marginTop={1}>
            <Text color="red">✗ Error: {error}</Text>
            {debug && <Text dimColor>Run ID: {database.runId}</Text>}
          </Box>
        ) : ( /* ... */ )}
        ```

*   **Graceful Handling of Expected Errors:** Specific error codes (e.g., `ENOENT` for file not found) are sometimes checked to ignore or handle expected errors without logging them as critical failures.
    *   **Example:**
        ```typescript
        // src/lib/cleanup-registry.ts
        unlink(file).catch((error) => {
          if (error.code !== "ENOENT") {
            console.error(`Failed to clean up ${file}:`, error.message)
          }
        })
        ```

## 5. STATE MANAGEMENT

State management is **localized within classes or module closures, minimizing global mutable state, and heavily leveraging React's hook-based state management with a strong emphasis on immutability and memoization.**

*   **Local Component/Hook State with `useState`:** All mutable state within React components and custom hooks is managed using `useState`.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        const [progress, setProgress] = useState(0)
        const [results, setResults] = useState<Map<Language, string> | null>(null)
        ```

*   **Immutable State Updates:** When updating array or object state, new instances are always created rather than mutating existing ones, which is crucial for React's reconciliation process.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        setWorkers(previousWorkers => previousWorkers.map(w => (w.id === updatedWorker.id ? updatedWorker : w)))
        ```

*   **Class/Closure-based State Encapsulation:** For non-React logic, state is encapsulated within classes (e.g., `DB`, `CleanupRegistry`) or module closures (e.g., `createStyleGuideProcessor`), reducing the risk of unintended side effects.

*   **`Map` and `Set` for Collections:** `Map` is frequently used for key-value collections where distinct keys and efficient lookups are beneficial (e.g., `fileGroups`, `results`, `filesByExtension`). `Set` is used for unique collections (e.g., `CleanupRegistry.handlers`, `allDirectories`).

## 6. API DESIGN

APIs are designed with **clarity, extensibility, and strong type safety** in mind, promoting clear module boundaries and ease of consumption.

*   **Clear Input/Output Types:** TypeScript interfaces and types are extensively used to define explicit contracts for function parameters, return types, and component props. `readonly` modifiers are frequently used for props and data structures to emphasize immutability.
    *   **Example:**
        ```typescript
        // src/lib/types.ts
        export type ProcessorOptions = BaseOptions & {
          concurrency: number
          model: string
          onProgress?: Callback<number>
          // ...
        }
        ```

*   **Stable Function References with `useCallback`:** Callback functions passed to child components or used in dependency arrays of other hooks are memoized with `useCallback` to prevent unnecessary re-renders and avoid infinite loops.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        const run = useCallback(async () => { /* ... */ }, [processor, fileGroups, inputDir, outputDir])
        ```

*   **Memoized Expensive Computations with `useMemo`:** The creation of complex objects or results of expensive computations are memoized with `useMemo` to optimize performance.
    *   **Example:**
        ```typescript
        // src/hooks/use-processor.ts
        const processor = useMemo(
          () => createStyleGuideProcessor({ /* ... */ }),
          [model, concurrency, inputDir, onWorkerUpdate, options.database],
        )
        ```

*   **Render Props for Extensibility:** Generic UI components (like `Table`) accept other components or functions as props (`header`, `cell`, `skeleton`) to allow consumers to customize rendering logic without modifying the core component.

## 7. TESTING APPROACH

While explicit test files are not provided, the codebase's structure strongly suggests a philosophy that favors **unit testing of pure components and utility functions, and integration testing of orchestrated flows.**

*   **Testable Component Design:** React components are designed as pure functions of their props, with minimal internal state and side effects, making them highly testable in isolation.
*   **Utility Function Isolation:** Helper functions that perform specific calculations or transformations are isolated and pure, allowing for independent unit testing.
*   **Implicit Integration Testability:** Orchestration logic (e.g., in `processor.ts` or `use-processor.ts`) is designed with clear entry points and callbacks, making it amenable to integration testing by mocking dependencies and observing side effects.
*   **Focus Areas (Inferred):** Correct state transitions, proper error handling, correctness of data transformations, and the core functionality of external processors.

## 8. PERFORMANCE PATTERNS

Performance is a clear consideration across the project, achieved through **strategic memoization, efficient data processing, and concurrency management.**

*   **Aggressive Memoization:** Extensive use of `useMemo` for derived values and `useCallback` for functions to prevent unnecessary re-renders and re-calculations, especially in React components.
*   **Efficient Data Structures:** Consistent use of `Map` and `Set` for collections where efficient lookups, additions, and deletions are beneficial.
*   **Asynchronous Operations & Concurrency:** Leveraging `async/await` and `Promise.all` for non-blocking I/O, and `p-queue` for managing concurrent operations, crucial for CLI performance.
*   **Conditional Rendering:** Components or parts of components are only rendered when necessary (e.g., based on `isLoading` or data availability) to reduce initial render time and memory footprint.
*   **File Size Checks:** Performing checks on file sizes before processing to avoid overhead from excessively large files.
*   **Dependency Array Discipline:** Careful management of dependency arrays for `useMemo` and `useCallback` to ensure correct memoization and avoid stale closures.
*   **Efficient Keying for Lists:** When rendering lists in React, unique and stable keys are generated (even using hashing like `sha1` if necessary) to optimize React's reconciliation process.

## 9. ANTI-PATTERNS

The developer implicitly avoids several common anti-patterns, indicating a preference for cleaner, more maintainable, and robust code.

*   **Direct State Mutation:** State objects or arrays are never mutated directly; new instances are always created for updates.
*   **Global Mutable State:** State is carefully encapsulated within classes, modules, or React components, minimizing shared mutable state.
*   **Deeply Nested Callbacks (Callback Hell):** Promises and `async/await` are consistently preferred for asynchronous flows.
*   **Uncontrolled Side Effects:** Side effects are encapsulated within hooks or explicit functions and managed with proper dependency arrays or explicit triggers.
*   **Magic Strings/Numbers for Critical Logic:** While not always externalized as constants, critical strings or numbers are used with clear context or as part of explicit error messages, avoiding ambiguity.
*   **Direct DOM Manipulation:** React's declarative paradigm is strictly adhered to for UI rendering, avoiding direct DOM manipulation.

## 10. DECISION TREES

These decision trees capture the developer's implicit criteria for choosing between alternative patterns across the project.

### 10.1. When to use `class` vs. `export const` function vs. React Hook (`use...`)

*   **`class`**:
    *   **Criteria:** For entities that manage internal state, have multiple related methods, or require instantiation (e.g., `DB` for database connection, `CleanupRegistry` for resource management).
*   **`export const` function**:
    *   **Criteria:** For pure functions, utility functions, or single-purpose operations that don't require internal state or React-specific lifecycle management (e.g., `explorer`, `generateStyleGuide`, `createFileCleanupHandler`).
*   **React Hook (`use...`)**:
    *   **Criteria:** When encapsulating reusable, stateful logic or side effects within a React component's lifecycle. When managing component-specific state, derived values, or stable function references (e.g., `useProcessor`).

### 10.2. When to use `useState` vs. `useMemo` vs. `useCallback`

*   **`useState`:**
    *   **Criteria:** When managing mutable state that changes over time and triggers re-renders within a React component or hook (e.g., `progress`, `results`, `isRunning`).
*   **`useMemo`:**
    *   **Criteria:** When creating an expensive object or computing a value that should only be re-calculated when its dependencies change (e.g., `processor` instance, `workersViewModel`).
*   **`useCallback`:**
    *   **Criteria:** When defining a function that needs a stable reference across renders (e.g., passed as a prop to a memoized child component, or used in a dependency array of another hook) (e.g., `run`, `reset`, `getDataKeys`).

### 10.3. When to Validate Inputs

*   **Criteria:** Always validate inputs for critical functions or methods that rely on external data, especially before performing expensive or irreversible operations. This applies to both CLI entry points and internal processing logic.
*   **Example:** `cli.ts` validates `GEMINI_API_KEY`; `useProcessor.ts` validates `fileGroups`, `inputDir`, `outputDir` before running the processor.

### 10.4. When to Create a Generic Component vs. Specific View

*   **Criteria:**
    *   **Generic Component:** If the UI pattern is reusable across different data types or contexts, primarily focuses on presentation, and its behavior can be configured entirely through props (e.g., `Table`, `ProgressBar`).
    *   **Specific View:** If the component displays domain-specific data and integrates multiple generic components to form a complete UI section (e.g., `ExplorerStatus`, `WorkerStatus`).

### 10.5. When to Use a Helper Function vs. Inline Logic

*   **Criteria:**
    *   **Helper Function:** If the logic is repeated, complex enough to warrant its own abstraction, improves readability of the main component/function, or can be a pure function with clear inputs and outputs (e.g., `intersperse`, `globpath`, `getCommonDirectory`).
    *   **Inline Logic:** If the logic is simple, unique to its immediate context, and doesn't obscure readability.

### 10.6. When to use `Set` vs. `Array` vs. `Map`

*   **`Set`**: When managing unique collections of items and efficient membership testing is needed (e.g., `CleanupRegistry.handlers`, `allDirectories`).
*   **`Array`**: For ordered collections where duplicates are allowed or iteration order is critical (e.g., `promises`, `files` in `FileGroup`).
*   **`Map`**: When managing key-value collections where keys are distinct and efficient lookups are beneficial (e.g., `filesByExtension`, `fileGroups`, `results`).

### 10.7. When to use `node:fs/promises` vs. `node:fs` (synchronous)

*   **`node:fs/promises`**: Preferred for file system operations to avoid blocking the event loop, especially in long-running processes (e.g., `unlink`, `stat`, `mkdir`, `rename`).
*   **`node:fs` (synchronous)**: Used sparingly, typically for initial setup or where blocking is acceptable and simplicity is prioritized (e.g., `mkdirSync` in `DB constructor` for immediate directory creation).

## 11. AI AGENT INSTRUCTIONS

To seamlessly mimic the Zenbase-AI developer's coding style across the entire project, an AI agent should follow this step-by-step guide.

### 11.1. Pre-Write Checklist

Before writing any code, perform the following:

1.  **Review Relevant Existing Code:** Always read components/modules in the same directory and any related utility files (`src/lib/types.ts`) to understand the immediate context and established patterns.
2.  **Identify Abstraction Level:** Determine if the task requires a generic, reusable component/utility, a custom React hook, or a specific view/orchestration logic.
3.  **Check Naming Conventions:** Confirm the appropriate `PascalCase` for components/types/classes, `camelCase` for variables/functions/methods, `use` prefix for hooks, `is` prefix for booleans, and `kebab-case` for file names. Ensure `Props` suffix for component prop types.
4.  **Determine Error Handling Approach:** Understand how errors are currently handled in similar contexts (display as data, explicit validation, `try...catch`, graceful degradation for expected errors).
5.  **Consider Performance vs. Readability:** Identify if the new code involves potentially expensive calculations or frequent re-renders, warranting `useMemo`/`useCallback` or efficient data structures.
6.  **Resource Management:** If dealing with external resources (files, database connections), plan for explicit setup and cleanup.

### 11.2. Writing Process

When writing code, adhere to these steps:

1.  **Problem Decomposition:** Start by breaking down the problem into smaller, manageable, and ideally pure, functional units. Think about what data transformations are needed.
2.  **Apply Naming Patterns:** Consistently use the established naming conventions for all identifiers.
3.  **Structure Code:**
    *   Organize files into appropriate directories (`components`, `hooks`, `lib`).
    *   Group imports logically (external, Node.js built-ins, internal relative), with `type` imports explicitly.
    *   Use functional components with destructured props.
    *   Separate logical blocks with blank lines and comments (e.g., `// State`, `/* Config */`).
    *   Group state declarations at the top of hooks.
    *   Place opening curly braces on the same line, closing on their own line.
    *   Format JSX for readability, especially multi-line attributes.
4.  **Implement Error Handling:** Pass errors as data to be displayed. Use conditional rendering for loading and empty states. Include defensive checks for `null`/`undefined` values and explicit input validation. Wrap asynchronous operations in `try...catch`.
5.  **Manage State:** Use `useState` for all local mutable state, ensuring immutable updates. Consider `Map` and `Set` for appropriate collections.
6.  **Leverage Memoization (React):** Use `useMemo` for derived values and `useCallback` for functions if they are expensive, passed as props, or used in dependency arrays. Be precise with dependency arrays.
7.  **Add Comments/Documentation:** Provide JSDoc for exported types and props. Use block comments for major sections or complex logic. Add inline comments sparingly for specific, non-obvious lines, focusing on *why* something is done.

### 11.3. Review Criteria

After writing code, self-review against these criteria:

1.  **Belonging:** Does the code "feel" like it belongs in this codebase? Does it seamlessly integrate with existing patterns, style, tone, and level of abstraction?
2.  **Naming Consistency:** Are all naming patterns (components, types, classes, variables, functions, files) consistent with existing code?
3.  **Abstraction Appropriateness:** Is the abstraction level appropriate for the context? Is core logic separated from React concerns? Is it too generic or too specific?
4.  **Error Handling Match:** Does the error handling strategy align with established patterns (displaying errors as data, defensive checks, `try...catch`)?
5.  **Developer's Choice:** Would the original developer make the same choices regarding structure, naming, performance, state management, and error handling?
6.  **Readability:** Is the code easy to read and understand? Are blank lines and comments used effectively?
7.  **Reusability:** If applicable, is the component/utility designed to be reusable and configurable via props/options?
8.  **Performance:** Are `useMemo` and `useCallback` used appropriately to optimize performance without sacrificing readability? Are efficient data structures employed?
9.  **Modularity:** Is the code modular with clear responsibilities and well-defined interfaces?
