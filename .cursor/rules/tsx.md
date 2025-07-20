---
description: tsx Style Guide
globs: "**/*.tsx"
alwaysApply: false
---

# Developer Style Guide: TypeScript React Components (.tsx)

This guide decodes the unique coding DNA of the developer, providing insights into their patterns, preferences, and the subtle decisions that make their code distinctively theirs. The goal is to enable an AI agent to seamlessly mimic this style, making contributions indistinguishable from the original author.

## 1. CORE PHILOSOPHY

The developer prioritizes **readability, maintainability, and functional purity** in UI components, with a keen eye on **performance optimization** for complex rendering scenarios. They believe in explicit data flow and clear separation of concerns, favoring composition over deep inheritance. The code "feels" clean, predictable, and robust, designed for long-term evolution.

**Rationale:** This approach minimizes cognitive load for future developers, reduces the likelihood of subtle bugs, and ensures a responsive user interface, especially in data-intensive components.

## 2. NAMING PATTERNS

### 2.1. Component Naming

*   **Convention:** `PascalCase` for component files and component exports.
*   **Rationale:** Standard React convention, clearly distinguishes components from other modules.
*   **Examples:**
    ```typescript
    // File: ExplorerStatus.tsx
    export const ExplorerStatus: React.FC<ExplorerStatusProps> = ({ ... }) => { ... }
    ```
    ```typescript
    // File: ProgressBar.tsx
    export const ProgressBar: React.FC<ProgressBarProps> = ({ ... }) => { ... }
    ```
    ```typescript
    // File: Index.tsx
    export const Index: React.FC<IndexProps> = ({ ... }) => { ... }
    ```
*   **Anti-Example (Avoid):** `explorerStatus.tsx` (camelCase file name), `export const explorerStatus = ...` (camelCase component name).

### 2.2. Prop Type Naming

*   **Convention:** `PascalCase` followed by `Props` suffix.
*   **Rationale:** Clearly identifies the interface as defining component properties.
*   **Examples:**
    ```typescript
    export type ExplorerStatusProps = {
      readonly fileGroups: Map<Language, FileGroup[]>
      readonly isLoading: boolean
    }
    ```
    ```typescript
    export type ProgressBarProps = {
      readonly value: number
      readonly max: number
      readonly label?: string
      readonly terminalWidth?: number
    }
    ```
    ```typescript
    export type IndexProps = {
      fileGroups: Map<Language, FileGroup[]>
      inputDir: string
      outputDir: string
      model: string
      concurrency: number
      total: number
      database: DB
      debug?: boolean
    }
    ```
*   **Anti-Example (Avoid):** `ExplorerStatusP`, `IExplorerStatusProps`.

### 2.3. Variable and Function Naming

*   **Convention:** `camelCase` for local variables, function names, and object keys. Descriptive and avoids excessive abbreviations unless contextually clear (e.g., `colI` for column index in a loop).
*   **Rationale:** Standard JavaScript/TypeScript convention, promotes readability.
*   **Examples:**
    ```typescript
    const foundLanguages = Array.from(fileGroups.keys())
    let fileCount = 0
    const languageCounts: Record<string, number> = {}
    ```
    ```typescript
    const truncateText = (text: string, maxWidth: number, padding: number): string => { ... }
    const intersperse = <T, I>(intersperser: (index: number) => I, elements: T[]): (T | I)[] => { ... }
    ```
    ```typescript
    const outputPath = (inputDir: string, outputDir: string, lang: Language) =>
      path.relative(inputDir, path.join(outputDir, `${lang}.md`))
    ```
*   **Anti-Example (Avoid):** `fL`, `fCnt`, `langCnts` (over-abbreviation).

### 2.4. Readonly Modifier

*   **Convention:** Use `readonly` for props and type properties that are not intended to be modified after creation.
*   **Rationale:** Enforces immutability, improves predictability, and leverages TypeScript's type safety.
*   **Examples:**
    ```typescript
    export type ExplorerStatusProps = {
      readonly fileGroups: Map<Language, FileGroup[]>
      readonly isLoading: boolean
    }
    ```
    ```typescript
    export type ProgressBarProps = {
      readonly value: number
      readonly max: number
      readonly label?: string
      readonly terminalWidth?: number
    }
    ```
    ```typescript
    export type WorkersStatusProps = {
      inputDir: string
      readonly workers: readonly Worker[]
      readonly queuedTasks?: readonly QueuedTask[]
    }
    ```
*   **Anti-Example (Avoid):** Omitting `readonly` when the property is not meant to be mutated.

## 3. CODE ORGANIZATION

### 3.1. File Structure and Component Cohesion

*   **Convention:** Each major UI component resides in its own `.tsx` file. Related helper components or utility functions that are *highly specific* to a single component are co-located within that component's file. Generic utilities are moved to a `lib` directory. Top-level application components (like `Index`) reside directly in `src/`.
*   **Rationale:** Promotes high cohesion and low coupling. Components are self-contained units. Clear separation between application entry points, core UI components, and reusable utilities.
*   **Examples:**
    *   `Table.tsx` contains `Table` component, `Header`, `Cell`, `Skeleton` (helper components specific to `Table`), and `row`, `truncateText`, `intersperse` (utility functions specific to `Table's` rendering logic).
    *   `ExplorerStatus.tsx`, `ProgressBar.tsx`, `WorkerStatus.tsx` are single-component files in `src/components/`.
    *   `index.tsx` (the main application component) and `main.tsx` (the CLI entry point) are in `src/`.
*   **Anti-Example (Avoid):** Placing `Header` or `Cell` in a separate `components/table/` subdirectory if they are not reusable outside `Table`. Mixing CLI setup logic directly within a React component.

### 3.2. Import Statement Organization

*   **Convention:** Imports are grouped and ordered:
    1.  Node.js built-in modules (e.g., `node:path`).
    2.  External libraries (e.g., `ink`, `react`).
    3.  Local relative imports (e.g., `../lib/types.js`, `./Table.js`).
    Type-only imports (`import type ...`) are often grouped separately or at the top of their respective sections.
*   **Rationale:** Consistency, readability, and easy identification of dependencies.
*   **Examples:**
    ```typescript
    // WorkerStatus.tsx
    import path from "node:path" // Node.js built-in
    import { Box, Text } from "ink" // External
    import type React from "react" // External type
    import { useMemo } from "react" // External
    import type { QueuedTask, Worker } from "../lib/types.js" // Local type
    import Table from "./Table.js" // Local component
    ```
    ```typescript
    // Index.tsx
    import path from "node:path" // Node.js built-in
    import { Box, Text, useApp } from "ink" // External
    import BigText from "ink-big-text" // External
    import Gradient from "ink-gradient" // External
    import { useEffect, useMemo } from "react" // External
    import { ExplorerStatus } from "./components/ExplorerStatus.js" // Local component
    import { ProgressBar } from "./components/ProgressBar.js" // Local component
    import Table from "./components/Table.js" // Local component
    import { WorkersStatus } from "./components/WorkerStatus.js" // Local component
    import { useProcessor } from "./hooks/use-processor.js" // Local hook
    import type { DB } from "./lib/database.js" // Local type
    import type { FileGroup, Language } from "./lib/types.js" // Local type
    ```
*   **Anti-Example (Avoid):** Mixed import order, e.g., `import Table from "./Table.js"` followed by `import { Box } from "ink"`.

### 3.3. Functional Component Structure

*   **Convention:** Functional components are defined as `React.FC<PropsType>` and use destructuring for props. `useMemo` and `useCallback` are used extensively for memoization of derived values and functions, respectively. `useEffect` is used for side effects, including component lifecycle management (e.g., running a process on mount, exiting on completion/error).
*   **Rationale:** Standard React functional component pattern, leverages memoization for performance, especially in components that re-render frequently or perform complex calculations. `useEffect` ensures proper handling of side effects and integration with the Ink application lifecycle.
*   **Examples:**
    ```typescript
    export const ExplorerStatus: React.FC<ExplorerStatusProps> = ({ fileGroups, isLoading }) => {
      // ... logic ...
      return (
        <Box>...</Box>
      )
    }
    ```
    ```typescript
    export const WorkersStatus: React.FC<WorkersStatusProps> = ({ workers, inputDir, queuedTasks = [] }) => {
      const workersViewModel = useMemo(
        () =>
          workers
            .map(agent => ({ ... })),
        [workers, inputDir],
      )
      // ...
    }
    ```
    ```typescript
    // Index.tsx
    export const Index: React.FC<IndexProps> = ({ ... }) => {
      const { exit } = useApp()
      const { run, workers, queuedTasks, progress, results, error, reset } = useProcessor({ ... })

      useEffect(() => {
        run()
      }, [run])

      useEffect(() => {
        if (results != null || error != null) {
          database.close()
          reset()
          exit()
        }
      }, [results, error, exit, reset, database])
      // ...
    }
    ```
*   **Anti-Example (Avoid):** Defining components as `function MyComponent(props: MyProps) { ... }` without `React.FC` or not using `useMemo`/`useCallback` for potentially expensive computations or stable function references. Performing side effects directly in the render function.

## 4. ERROR HANDLING

*   **Convention:** Error handling in UI components is primarily focused on **displaying errors passed down via props** rather than internal `try/catch` blocks for rendering logic. Data validation and error generation are assumed to happen upstream (e.g., in data fetching layers or business logic, or custom hooks like `useProcessor`). Components react to an `error` prop to display appropriate messages.
*   **Rationale:** UI components are responsible for presentation. Separating error generation from error presentation simplifies component logic and allows for centralized error management and consistent UI feedback.
*   **Examples:**
    ```typescript
    // WorkerStatus.tsx
    // The 'error' property is part of the Worker type, passed down.
    status:
      agent.status === "idle"
        ? "Waiting..."
        : agent.status === "working"
          ? agent.progress || "Working..."
          : agent.status === "success"
            ? "Success"
            : agent.error, // Displaying the error if agent.status is an error state
    ```
    ```typescript
    // Index.tsx
    ) : error != null ? (
      <>
        <ExplorerStatus fileGroups={fileGroups} isLoading={false} />
        <Box marginTop={1}>
          <Text color="red">✗ Error: {error}</Text>
          {debug && <Text dimColor>Run ID: {database.runId}</Text>}
        </Box>
      </>
    ) : (
    ```
*   **Anti-Example (Avoid):** `try/catch` blocks directly within `render` methods or `useMemo` hooks for data that is expected to be valid. UI components performing complex error validation that should be handled by business logic.

## 5. STATE MANAGEMENT

*   **Convention:** Local component state is managed using React's built-in hooks (`useState`, `useMemo`, `useCallback`, `useEffect`). There is no evidence of a global state management library (e.g., Redux, Zustand). Derived state is heavily memoized using `useMemo`. Complex, shared logic and state are encapsulated within **custom hooks** (e.g., `useProcessor`), which then expose their state and methods via a structured return object.
*   **Rationale:** For the current scope of UI components, local state and prop drilling are sufficient. `useMemo` ensures performance by preventing unnecessary re-calculations of derived data. Custom hooks promote reusability, testability, and a clear separation of concerns for complex logic.
*   **Examples:**
    ```typescript
    // ExplorerStatus.tsx
    // fileGroups and isLoading are passed as props, acting as external state.
    // Internal derived state: fileCount, languageCounts
    let fileCount = 0
    const languageCounts: Record<string, number> = {}
    for (const [language, groups] of fileGroups) { ... }
    ```
    ```typescript
    // Table.tsx
    const getConfig = useMemo((): TableProps<T> => { ... }, [...])
    const getColumns = useMemo((): Column<T>[] => { ... }, [...])
    const getHeadings = useMemo((): Partial<T> => { ... }, [...])
    ```
    ```typescript
    // Index.tsx (using custom hook)
    const { run, workers, queuedTasks, progress, results, error, reset } = useProcessor({ ... })
    ```
*   **Anti-Example (Avoid):** Direct mutation of props or state objects without using setter functions or creating new objects. Spreading complex logic and state management across multiple components without encapsulation in a custom hook.

## 6. API DESIGN

*   **Convention:** Components expose a clear, well-typed API through their `Props` interfaces. They are designed to be highly configurable and reusable. Custom hooks also expose a clear API via a structured return object.
*   **Rationale:** Promotes component and hook reusability, simplifies integration into different parts of the application, and improves type safety.
*   **Examples:**
    *   `Table` component's API:
        ```typescript
        export type TableProps<T extends ScalarDict> = {
          data: T[]
          columns: (keyof T)[]
          padding: number
          columnWidths?: Record<keyof T, number>
          header: (props: React.PropsWithChildren) => React.JSX.Element
          cell: (props: CellProps) => React.JSX.Element
          skeleton: (props: React.PropsWithChildren) => React.JSX.Element
        }
        ```
        This shows a highly configurable component that accepts other components as props (`header`, `cell`, `skeleton`), demonstrating a flexible API design.
    *   `Index` component's API:
        ```typescript
        export type IndexProps = {
          fileGroups: Map<Language, FileGroup[]>
          inputDir: string
          outputDir: string
          model: string
          concurrency: number
          total: number
          database: DB
          debug?: boolean
        }
        ```
        This shows a component designed to receive all necessary application-level data and configuration as props.

## 7. TESTING APPROACH

*   **Convention:** (Based on the provided files, no test files were included in the context. Therefore, this section is speculative based on common best practices for this style of code.)
    *   **Unit Testing:** Components would likely be unit tested using a library like React Testing Library to ensure they render correctly given various props and states, and that user interactions (if any) behave as expected. Custom hooks would be tested independently to verify their logic and state management.
    *   **Snapshot Testing:** Potentially used for UI regression, especially for complex components like `Table` or the overall `Index` component's output.
    *   **Focus:** Testing the component's rendering logic, prop handling, derived state calculations, and the behavior of custom hooks.
*   **Rationale:** Ensures UI components and their underlying logic are robust and behave predictably, catching regressions early.

## 8. PERFORMANCE PATTERNS

*   **Convention:** Aggressive use of `useMemo` and `useCallback` to prevent unnecessary re-renders and re-calculations of expensive values or functions. This is particularly evident in the `Table` component, which deals with potentially large datasets, and in `Index.tsx` for derived view models and stable function references. `useEffect` dependencies are carefully managed to prevent infinite loops or unnecessary re-runs.
*   **Rationale:** Optimizes rendering performance, especially crucial for CLI applications where re-rendering can be noticeable. Ensures that computations are only performed when their dependencies actually change.
*   **Examples:**
    ```typescript
    // Table.tsx
    const getConfig = useMemo((): TableProps<T> => { ... }, [...])
    const getColumns = useMemo((): Column<T>[] => { ... }, [...])
    const getHeadings = useMemo((): Partial<T> => { ... }, [...])
    const header = useMemo(() => row<T>({ ... }), [getConfig])
    // ... and many more useMemo calls for rendering utilities
    ```
    ```typescript
    // WorkerStatus.tsx
    const workersViewModel = useMemo(
        () => workers.map(agent => ({ ... })),
        [workers, inputDir],
    )
    const columnWidths = useMemo(() => ({ agent: 8, directory: 22, status: 90 }), [])
    ```
    ```typescript
    // Index.tsx
    const resultsViewModel = useMemo(
      () =>
        results == null
          ? []
          : Array.from(results.keys())
              .map(language => ({ language, path: outputPath(inputDir, outputDir, language) }))
              .toSorted((a, b) => a.language.localeCompare(b.language)),
      [results, inputDir, outputDir],
    )

    useEffect(() => {
      run()
    }, [run]) // 'run' is memoized by useCallback in useProcessor
    ```
*   **Anti-Example (Avoid):** Performing complex calculations directly in the render function without memoization, leading to re-calculation on every re-render. Missing dependencies in `useEffect` or `useMemo`/`useCallback` leading to stale closures or unnecessary re-runs.

## 9. ANTI-PATTERNS

*   **Direct DOM Manipulation:** No direct DOM manipulation is observed, adhering to React's declarative paradigm.
*   **Uncontrolled Components:** Components are generally "controlled" by their props, meaning their behavior is dictated by the parent component's state.
*   **Magic Strings/Numbers:** While some literal strings are used for UI text, key configurations (like `terminalWidth = 80` default) are either props or clearly defined.
*   **Deeply Nested Components:** While components can be nested, the structure tends to be relatively flat, favoring composition.
*   **Mutable Props/State:** The `readonly` keyword and `useMemo`/`useCallback` usage indicate a strong preference for immutability.
*   **Logic in `main.tsx` beyond initial setup and rendering:** `main.tsx` is kept minimal, focusing solely on setting up the CLI environment and rendering the root React component. All complex application logic is delegated to `cli.ts` or the React component tree.

## 10. DECISION TREES

### 10.1. When to use `useMemo` vs. direct calculation

*   **Criteria:**
    *   **Use `useMemo`:** When the calculation is computationally expensive, involves iterating over large data structures, or the result is an object/array that would cause unnecessary re-renders of child components if not memoized. Also, for creating stable object/array references that are used in `useEffect` or `useCallback` dependency arrays.
    *   **Direct Calculation:** For simple, cheap calculations that don't involve complex data structures or don't impact child component re-renders.
*   **Example (Use `useMemo`):**
    ```typescript
    // WorkerStatus.tsx
    const workersViewModel = useMemo(
      () =>
        workers
          .map(agent => ({
            agent: agent.id,
            directory: agent.directory && agent.language ? globpath(inputDir, agent.directory, agent.language) : "",
            status: agent.status === "idle" ? "Waiting..." : agent.status === "working" ? agent.progress || "Working..." : agent.status === "success" ? "Success" : agent.error,
          }))
          .filter(agent => agent.directory),
      [workers, inputDir], // Dependencies
    )
    // Rationale: This transformation involves mapping and filtering an array, which can be expensive if 'workers' or 'inputDir' change frequently.
    ```
    ```typescript
    // Index.tsx
    const resultsViewModel = useMemo(
      () =>
        results == null
          ? []
          : Array.from(results.keys())
              .map(language => ({ language, path: outputPath(inputDir, outputDir, language) }))
              .toSorted((a, b) => a.language.localeCompare(b.language)),
      [results, inputDir, outputDir],
    )
    // Rationale: This involves array mapping, filtering, and sorting, which can be expensive and the result is an array, so memoization prevents unnecessary re-renders of the Table component.
    ```
*   **Example (Direct Calculation):**
    ```typescript
    // ProgressBar.tsx
    const width = 40
    const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
    const filled = Math.round((percentage / 100) * width)
    const empty = width - filled
    // Rationale: These are simple arithmetic operations on primitive values, not expensive enough to warrant memoization.
    ```

### 10.2. When to create a new component vs. inline rendering

*   **Criteria:**
    *   **New Component:** When a piece of UI has its own distinct responsibilities, manages its own internal state, needs to be reused in multiple places, or significantly improves readability by encapsulating complex rendering logic. Also, for creating clear boundaries for performance optimizations (e.g., `React.memo`).
    *   **Inline Rendering:** For simple, presentational logic that is tightly coupled to the parent component and not intended for reuse.
*   **Example (New Component):**
    ```typescript
    // Table.tsx
    export const Header = (props: React.PropsWithChildren) => (
      <Text bold color="blue">
        {props.children}
      </Text>
    )
    // Rationale: Header has a distinct presentational role and could potentially be customized further, making it a good candidate for a separate component.
    ```
    ```typescript
    // Index.tsx
    <ProgressBar value={progress} max={total} label="files" />
    <WorkersStatus workers={workers} inputDir={inputDir} queuedTasks={queuedTasks} />
    // Rationale: ProgressBar and WorkersStatus are distinct UI elements with their own props and internal logic, making them good candidates for separate components that can be reused and managed independently.
    ```
*   **Example (Inline Rendering):**
    ```typescript
    // ExplorerStatus.tsx
    {isLoading && (
      <Text color="cyan">
        <Spinner type="dots" />
      </Text>
    )}
    // Rationale: This is a simple conditional rendering of a spinner, tightly coupled to the 'isLoading' prop, not complex enough to warrant a separate component.
    ```

### 10.3. When to use a Custom Hook vs. Component Logic

*   **Criteria:**
    *   **Custom Hook:** When you need to encapsulate reusable, stateful logic that is not directly tied to UI rendering, or when you want to share complex logic (e.g., data fetching, subscriptions, timers, business logic) across multiple components. Custom hooks promote separation of concerns and improve testability of the logic.
    *   **Component Logic:** For UI-specific state and effects that are tightly coupled to the component's rendering and are not intended for reuse elsewhere.
*   **Example (Custom Hook):**
    ```typescript
    // Index.tsx
    const { run, workers, queuedTasks, progress, results, error, reset } = useProcessor({ ... })
    // Rationale: `useProcessor` encapsulates the entire style guide generation process, including worker management, progress tracking, results, and error handling. This logic is complex and stateful, making it an ideal candidate for a custom hook that can be reused or tested independently of the UI.
    ```
*   **Example (Component Logic):**
    ```typescript
    // Index.tsx
    useEffect(() => {
      if (results != null || error != null) {
        database.close()
        reset()
        exit()
      }
    }, [results, error, exit, reset, database])
    // Rationale: This effect directly interacts with the Ink application's lifecycle (`exit()`) and is specific to the top-level Index component's responsibility of managing application termination.
    ```

## 11. AI AGENT INSTRUCTIONS

To contribute code in this developer's style, follow these steps:

### 11.1. Pre-Write Checklist

1.  **Review Relevant Existing Code:** Before writing any new code, thoroughly examine existing `.tsx` files in the same directory (`src/components/`) or related modules. Pay close attention to `ExplorerStatus.tsx`, `ProgressBar.tsx`, `Table.tsx`, `WorkerStatus.tsx`, and especially `index.tsx` for top-level application patterns.
2.  **Identify Abstraction Level and Patterns:** Determine the current abstraction level of the surrounding code. Are you working with low-level UI primitives, higher-level composite components, or application-level orchestration? Mimic the existing patterns (e.g., `useMemo`/`useCallback`/`useEffect` usage, prop drilling vs. custom hooks).
3.  **Check Naming Conventions:** Verify naming conventions for similar concepts (components, props, variables, types). Ensure your proposed names align with the `PascalCase` for components/types and `camelCase` for variables/functions, and use `Props` suffix for prop types.
4.  **Determine Error Handling Approach:** Understand how errors are currently handled in the context you're modifying. Is it via prop passing for UI display, or is there a specific error boundary pattern? Ensure consistency.
5.  **Consider Performance vs. Readability Trade-offs:** For any new logic, evaluate if memoization (`useMemo`, `useCallback`) is necessary for performance. Prioritize readability unless a clear performance bottleneck is identified.

### 11.2. Writing Process

1.  **Start with Problem Decomposition:** Break down the problem into smaller, manageable UI components or logical units. Favor composition. For complex, reusable logic, consider encapsulating it in a custom hook.
2.  **Apply Naming Patterns Consistently:** Use `PascalCase` for component and type names, `camelCase` for variables and functions. Apply `readonly` to props and immutable type properties.
3.  **Structure Code Following Established Organizational Patterns:**
    *   Place each major component in its own `.tsx` file (or `src/` for top-level app components).
    *   Co-locate highly specific helper components/utilities within the main component's file.
    *   Organize imports: Node.js built-ins, then external libraries, then local relative imports. Separate type imports.
    *   Use `React.FC<PropsType>` for functional components and destructure props.
    *   Utilize `useEffect` for side effects and lifecycle management, ensuring correct dependency arrays.
4.  **Implement State Management:** Use `useState` for local component state. Employ `useMemo` for memoizing expensive computations/objects and `useCallback` for memoizing function definitions. Encapsulate complex, shared logic and state in custom hooks.
5.  **Implement Error Handling Using Identified Strategies:** Pass errors down as props for UI display. Avoid internal `try/catch` for rendering logic unless explicitly required for a specific interaction.
6.  **Add Comments/Documentation Matching Developer's Style:** Keep comments sparse and focused on *why* complex logic exists, or for JSDoc-like type descriptions. Avoid redundant comments explaining *what* the code does.

### 11.3. Review Criteria

1.  **Does it feel like it belongs in this codebase?** This is the ultimate test. Does the code's style, structure, and overall approach align with the existing files?
2.  **Are naming patterns consistent with existing code?** Check component names, prop names, variable names, and type names.
3.  **Is the abstraction level appropriate for the context?** Is the component too granular or too monolithic? Does it fit the existing component hierarchy? Is complex logic appropriately encapsulated in custom hooks?
4.  **Does error handling match established patterns?** Are errors displayed correctly if passed down? Is there no unnecessary internal error handling?
5.  **Would the original developer make the same choices?** Consider the trade-offs made (e.g., performance vs. readability, composition vs. inheritance, custom hooks vs. inline logic) and ensure they align with the developer's core philosophy.
6.  **Is memoization (`useMemo`, `useCallback`) and `useEffect` dependency management applied appropriately?** Check for potential performance improvements or unnecessary memoization/re-runs.
7.  **Is the code clean, readable, and predictable?** Look for clear data flow, minimal side effects, and easy-to-understand logic.
8.  **Is the separation between CLI entry point (`main.tsx`) and React application (`index.tsx`) maintained?** Ensure `main.tsx` remains lean and focused on rendering the root component.