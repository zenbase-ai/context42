# Project Overview

We will build a Node.js CLI tool (packaged as an npm module) using TypeScript and Ink for interactive terminal interfaces. The goal is to replicate the functionality of the previous Go-based plan in a TypeScript environment, integrating the Google Gemini CLI for AI-powered features. Key tools include Ink for building React-based interactive CLI interfaces with progress bars, Google's ZX library for running shell commands (to invoke Gemini CLI), better-sqlite3 for database storage, and Ava for testing.

Key Objectives:
• Use Ink to create an interactive CLI with real-time progress tracking and dynamic UI updates in TypeScript.
• Integrate the Gemini CLI (Google’s AI agent) as a dependency and use ZX to execute Gemini commands from our Node CLI.
• Use better-sqlite3 to handle local SQLite database operations for data persistence.
• Ensure robustness with Ava tests (unit and integration) for the CLI commands, database interactions, and Gemini integration.

## How it should work at the end

```bash
export GEMINI_API_KEY="..." bunx context42
# ./context42/{py,ts,go}.md are filled with style guides based on recursively discovered code in the cwd
# TUI should have:
# First section: spinny loady animation with label saying "Exploring...". Below it it should have room for 1 paragraph of text.
# Second section: 1 row for each worker with the loady animation + status + relative path to the directory they're working on
# 1 line at the bottom, progress bar, total = number of directories to explore, current = number of directories explored w/ Gemini
bunx context42 -i dir/ # analyze the code in the ./dir/ folder
bunx context42 -o .cursor/rules/ # save the style guides to .cursor/rules/
```

## CLI Framework with Ink

We use Ink, a React-based library for building interactive command-line interfaces in Node.js. Ink allows us to create dynamic, responsive terminal UIs using familiar React patterns, which is perfect for showing progress bars and real-time updates as we process folders with multiple Gemini CLI instances.

Setup with Ink:
• Installation: Add Ink and React to our dependencies: `npm install ink react`. Ink provides React components specifically designed for terminal rendering.
• Interactive UI Components: We'll use Ink's built-in components like `<Box>` for layout, `<Text>` for styled text, and create custom components for our progress bar that updates as Gemini CLI instances complete their work.
• Progress Bar Implementation: When processing folders:

- First, we collect the total number of folders to process
- Display a progress bar using Ink's rendering capabilities
- Run Gemini CLI instances with max concurrency of 8 (configurable, default=8)
- As each instance completes, update the progress bar in real-time
- Show status messages, errors, or completion notifications dynamically
  • Command Structure: Each CLI command will render an Ink app that provides interactive feedback. For example:

```jsx
import React, {useState, useEffect} from 'react';
import {render, Box, Text} from 'ink';
import {ProgressBar} from './components/ProgressBar';

const ProcessFoldersCommand = ({folders}) => {
	const [completed, setCompleted] = useState(0);
	const total = folders.length;

	// Logic to process folders with Gemini CLI
	// Update completed count as each finishes

	return (
		<Box flexDirection="column">
			<Text>Processing {total} folders with Gemini CLI...</Text>
			<ProgressBar current={completed} total={total} />
			<Text color="green">
				{completed}/{total} completed
			</Text>
		</Box>
	);
};
```

By using Ink, we provide a modern, interactive CLI experience with real-time progress tracking, making it clear to users how their batch processing is progressing.

## Integrating Google Gemini CLI via ZX

One key feature is integrating the Google Gemini CLI (an AI agent CLI) into our tool. The Gemini CLI is an open-source command-line tool that brings the power of Google’s Gemini AI model to the terminal ￼. It allows advanced AI-driven workflows, like querying codebases, generating content from multimodal inputs, and automating development tasks, directly from the CLI ￼. Instead of reimplementing AI logic, we will invoke this existing Gemini CLI from our Node.js CLI.

Adding Gemini CLI as a Dependency: We will add the Gemini CLI package (e.g. @google/gemini-cli) to our project’s dependencies. This ensures we have the CLI available locally. (The Gemini CLI can normally be installed globally via npm, but bundling it as a dependency locks the version and lets us invoke it programmatically.)

Using ZX for Execution: To call Gemini CLI commands from Node, we use Google’s ZX library. ZX simplifies running shell commands in Node by providing a $ tagged template that handles spawning processes with proper escaping and returns a promise ￼. This allows us to call the gemini command as if we were in a shell, but within our Node code asynchronously. For example:

import { $ } from 'zx';

await $`gemini some-command --option=value`;

Using ZX has several benefits:
• Simplicity: We can write shell commands in JavaScript/TypeScript directly, which is more convenient than using Node’s child_process with manual argument escaping ￼.
• Async/Await: ZX commands return promises, so we can await the completion of the Gemini CLI command. This fits nicely in our Oclif command handlers (which can be async).
• Output Handling: We can capture the output of Gemini CLI. The promise resolves with an object containing the output (stdout/stderr), allowing us to parse results or handle errors as needed.

Implementing Gemini-related Commands: In our CLI, certain commands will act as wrappers or orchestrators that use Gemini:
• For instance, if the original plan had a command to perform an AI-driven task (e.g., analyzing code or generating files), the TypeScript command will call the appropriate gemini CLI function using ZX.
• We might create a utility module (e.g. src/gemini.ts) to encapsulate Gemini CLI calls. This module can have functions like runGeminiQuery(prompt: string) which uses ZX to execute gemini with the given prompt or command, and returns the AI’s response.
• Environment: The Gemini CLI requires authentication (Google account or API key). We will ensure the environment is set up (e.g., the user might have GEMINI_API_KEY or will be prompted on first use). Our CLI may simply invoke gemini and allow it to handle auth (the first invocation will trigger Gemini CLI’s own auth flow in the browser, as per its docs). We should document this requirement for the user.

Example Usage: Suppose we have a CLI command analyze-code. The implementation might do:

1.  Gather necessary input (maybe a file path or question) from flags/args.
2.  Use ZX to call gemini with a prompt like “Analyze the code in XYZ file for potential issues”.
3.  Wait for Gemini’s output and then post-process or simply display it.
4.  Optionally, store the result in the SQLite database for caching or auditing (see next section).

By integrating the Gemini CLI, we offload heavy AI computation to that tool. Our Node CLI acts as a coordinator, ensuring that the original Go app’s functionality is preserved but now enhanced by direct calls to Gemini’s powerful features.

## Data Persistence with SQLite (better-sqlite3)

For storing persistent data (such as configuration, logs, or results from Gemini queries), we use a local SQLite database. In Node.js, better-sqlite3 provides a synchronous API that is simpler, faster, and more reliable than the asynchronous sqlite3 driver. This is functionally equivalent to how the Go version likely used a database, but now in a Node/TS context.

Setup SQLite in Node:
• We use better-sqlite3, which is a low-level binding that gives direct synchronous access to SQLite3. Despite being synchronous, it's actually faster than asynchronous drivers for most use cases because it avoids the overhead of the Node.js thread pool.
• We will create or open a database file (e.g. data.db) at startup or on first use. Using the Database constructor from better-sqlite3:

import Database from 'better-sqlite3';

const db = new Database('./data.db');

This returns a db object that we can use for queries. All operations are synchronous, which simplifies error handling and transaction management.

• We may initialize the database in a module that each command can import. Ensuring a single instance of the DB connection for the app runtime is ideal.

Database Schema: Based on the functionality, define what needs to be stored. For example, if we need to cache Gemini query results or store user prompts, we create a table for that. If the original Go version had certain data (like records of tasks, user settings, etc.), we replicate those tables in SQLite. We can use SQL migrations:
• With better-sqlite3, we can run migration scripts using db.exec() for DDL statements or prepare statements for data migrations. We will write migration files for the initial schema (and future updates if needed).

Using the Database:
• In Commands: When a command needs to save or retrieve data, it will query the SQLite DB. For instance, after getting a response from Gemini, we might insert a new row into a responses table with the prompt, result, and timestamp:

const stmt = db.prepare('INSERT INTO responses(prompt, result, created_at) VALUES (?, ?, ?)');
stmt.run(prompt, result, new Date().toISOString());

• Fetching Data: Similarly, to implement features like listing past results or checking config, we use prepared statements with .get() for single records or .all() for multiple. These return results as JS objects:

const stmt = db.prepare('SELECT \* FROM responses ORDER BY created_at DESC LIMIT ?');
const responses = stmt.all(10);

• Transactions: better-sqlite3 has excellent transaction support. We can wrap multiple operations in a transaction for consistency:

const insertMany = db.transaction((responses) => {
for (const response of responses) {
stmt.run(response.prompt, response.result, response.created_at);
}
});

• Closing DB: Ensure the DB is closed on CLI exit using db.close(). Since the operations are synchronous, we don't need to worry about pending async operations.

By using better-sqlite3, we achieve a simple embedded datastore that requires no additional infrastructure. The synchronous API is actually an advantage for CLI tools, as it simplifies the code and provides better performance for typical CLI usage patterns.

## Testing with Ava

Areas to Test:

1.  Database Operations: Write unit tests for any database utility functions or for migrations. For example, we can have a test that opens an in-memory SQLite database (new Database(':memory:')) and verifies that our schema creation and queries work as expected. This ensures the better-sqlite3 integration is correct.
2.  Gemini Integration (Mocking): Since the Gemini CLI involves calling an external process, in unit tests we will mock the ZX calls to gemini. We can abstract the Gemini call (e.g. the gemini.ts module mentioned earlier) so that in tests we substitute it with a dummy function. For instance, instead of actually running gemini, the mock can return a preset string (simulating an AI response). This way, we can test our command logic without needing the real AI each time or having network dependencies.
3.  Ink Component Testing: We can test our Ink components using React testing patterns. Ink provides testing utilities to render components and capture their terminal output. We will write tests for:
    • Progress bar component behavior and rendering
    • Status message updates
    • Error state displays
    • User interaction flows
4.  CLI Command Logic: We'll test the core logic of our commands by mocking the Ink rendering and focusing on the business logic. Tests will ensure:
    • Correct parsing of command arguments
    • Proper orchestration of concurrent Gemini CLI calls
    • Database operations are performed correctly
    • Error conditions are handled gracefully with appropriate UI feedback
5.  End-to-End (optional): For higher confidence, we might include a small end-to-end test: spawn our CLI in a child process with known inputs and see that it produces the expected outputs, using a temporary database. This would test the integration of all parts (though this might be done sparingly due to complexity).

Ava will run these tests quickly and supports TypeScript test files. We can use its watch mode during development for rapid feedback. The goal is to ensure that the new TypeScript CLI behaves identically to the original Go version, which our tests can confirm by mirroring the scenarios tested in the Go implementation.

Test Example: If the CLI has a command say-hello that simply prints a greeting, a Ava unit test might call our command’s run function and assert that the console output contains the greeting. For a command interacting with Gemini, we inject a fake response and then assert that the CLI output (or database entry) corresponds to that fake AI response, validating our handling logic.

By using Ava, we benefit from a testing tool that is fast and TypeScript-friendly, making it easier to maintain a robust test suite as we iterate on the project ￼.

Additional Considerations
• TypeScript Configuration: Since we are writing in TypeScript, ensure tsconfig.json is set up to target a suitable Node version (Node 20+ if using Gemini CLI). We will compile the TypeScript to JavaScript using tsc or a build tool like esbuild. This also means our package can be published to npm if desired.
• Error Handling: We should add error handling especially around the Gemini CLI calls (e.g., network issues or API limits). Using ZX, if a command exits with non-zero status, it will throw; we can catch errors from await $ and present a user-friendly message or log details.
• CLI User Experience: With Ink, we can create a highly interactive and visual CLI experience. We'll implement:

- Real-time progress bars showing the status of concurrent Gemini CLI processes
- Dynamic status updates as folders are processed
- Clear visual indicators for success, errors, and warnings
- Interactive prompts when user input is needed
- Smooth animations and transitions for a polished user experience
  For help and command documentation, we'll implement a simple command parser that shows available commands and options. If Gemini CLI needs initial setup (auth), our Ink interface will display clear instructions and guide the user through the process with visual feedback.
  • Maintaining Parity with Go Version: Since the functionality is to remain identical, we will use the Go implementation as a reference for business logic. All core features (data processing, conditions, etc.) should be reproduced. The difference is that where Go might have made HTTP calls or local computations, we might now call the Gemini AI for intelligent operations, but only if that was intended in the new plan. Otherwise, keep logic consistent, just translated into TypeScript and using Node libraries.

In summary, this plan lays out how to implement the CLI in Node.js with TypeScript, leveraging Ink for creating interactive terminal interfaces with real-time progress tracking, ZX for calling the powerful Gemini AI CLI with proper concurrency control (max 8 concurrent instances), better-sqlite3 for data persistence with a synchronous API, and Ava for ensuring everything works correctly. By following this approach, we will achieve a functionally identical tool to the original, while providing a superior user experience through Ink's dynamic UI capabilities and visual feedback during batch processing operations.
