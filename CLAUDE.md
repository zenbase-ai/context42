# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Principles

1. Frequently refer to PLAN.md for the project plan.
2. As you work, create a new log in .claude/logs/{plan-name}/{int}.md, where int is an increasing integer. You can reference previous logs. You'll have to create the directory.

## Project Overview

Context42 is a TypeScript CLI project that is currently transitioning from an Oclif-based architecture (in the archive folder) to an Ink-based interactive CLI using React components. The project aims to integrate Google Gemini CLI for AI-powered code analysis and uses SQLite for local data persistence.

## Development Commands

All commands are run through `just` (see justfile). The project uses:
- `.env` file loading enabled by default
- Biome for formatting and linting
- Vitest for testing
- Bunup for building

### Build & Development

- `just dev` - Watch mode for development (runs bunup --watch)
- `just build` - Production build (runs bunup)
- `just cli [args]` - Build and run the CLI with arguments

### Testing

- `just test [args]` - Run tests with vitest (can pass file path or other vitest args)
- `just coverage` - Generate test coverage report

### Code Quality

- `just fmt` - Format code with Biome (auto-fix with --write --unsafe)
- `just lint` - Lint code with Biome (check only with --unsafe)

### External CLIs

- `just claude [args]` - Run Claude Code CLI via bunx
- `just gemini [args]` - Run Gemini CLI via bunx

### Publishing

- `just publish <version>` - Bump version with pnpm and publish to npm

## Architecture & Structure

### Important Patterns

1. The project uses ESM modules (type: "module" in package.json)
2. TypeScript is configured with strict mode and path aliases (@/_ -> ./src/_)
3. Database operations use SQLite with migrations stored in ~/.context42/data.db
4. Gemini CLI integration uses ZX for shell command execution with proper error handling for authentication and missing CLI scenarios

## Lint and Type Checking

- **Biome** is used for both formatting and linting (replaced Prettier and XO)
- TypeScript compiler (tsc) is available for type checking via the build command
- Use `just fmt` for auto-formatting and `just lint` for checking

## Rules

- Use `fd`, not `find`
- Use `rg`, not `grep`
- Use `const myFn = () => {}` instead of `function myFn() {}`
- Use `const MyComponent: React.FC<MyComponentProps> = ({}) => {}` instead of `const MyComponent = ({}: MyComponentProps) => {}`
- Prefer `type` to `interface`
- Prefer a lightweight functional style that minimizes lines of code vs. class based

## Project Structure Details

### Core Components

- **Explorer** (`src/lib/explorer.ts`): Recursively discovers files and directories in the project
  - Uses `globby` for file pattern matching
  - Filters out common ignore patterns (node_modules, .git, etc.)
  - Returns structured file/directory information

- **Processor** (`src/lib/processor.ts`): Manages concurrent worker processes for analyzing code
  - Implements worker pool pattern with configurable concurrency (default: 8)
  - Uses `p-limit` for concurrency control
  - Handles task distribution and result collection
  - Tracks all created `style.{ext}.md` files for cleanup
  - Automatically cleans up temporary files in finally block using `unlink`
  - Only moves the last file per language to output directory

- **Generator** (`src/lib/generator.ts`): Generates prompts and processes Gemini AI responses
  - Creates context-aware prompts for style guide generation
  - Parses and structures AI responses
  - Handles different programming languages

- **Database** (`src/lib/database.ts`): SQLite persistence layer
  - Stores Gemini responses and style guides with run IDs
  - Located at `~/.context42/data.db`
  - Automatic table creation on first run
  - Proper connection lifecycle management
  - Supports resuming runs with existing run ID via constructor parameter

### UI Components (Ink/React)

- **ExplorerStatus** (`src/components/ExplorerStatus.tsx`): Shows file discovery progress
- **WorkerStatus** (`src/components/WorkerStatus.tsx`): Displays status of concurrent workers
- **ProgressBar** (`src/components/ProgressBar.tsx`): Visual progress indicator

## Database Schema

```sql
-- Gemini AI responses
CREATE TABLE responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    result TEXT NOT NULL,
    created_at DATETIME NOT NULL
);
CREATE INDEX idx_responses_lookup ON responses(run_id, created_at DESC);

-- Style guides for different languages
CREATE TABLE style_guides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    language TEXT NOT NULL,
    content TEXT NOT NULL,
    directory TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
CREATE INDEX idx_style_guides_lookup ON style_guides(run_id, language, directory);
```

## Testing Guidelines

### Test Framework: Vitest
- Test files use `.test.ts` or `.test.tsx` extension
- Located alongside source files in `test/` directory
- Uses Vitest for fast, ESM-native testing
- React component testing with `ink-testing-library`

### Test Patterns
```typescript
// Unit test example
test('component renders correctly', () => {
  const {lastFrame} = render(<Component />);
  expect(lastFrame()).toMatch('expected output');
});

// Database test example
test('saves and retrieves style guide', () => {
  const db = new DB(':memory:');
  db.init();
  db.saveStyleGuide('typescript', '# Style Guide', '/project');
  const guide = db.getStyleGuide('typescript', '/project');
  expect(guide?.content).toBe('# Style Guide');
  db.close();
});

// Cleanup test example
test('processor cleans up style files on error', async () => {
  const { rename, unlink } = await import("node:fs/promises")
  vi.mocked(rename).mockReset().mockRejectedValue(new Error("Permission denied"))
  vi.mocked(unlink).mockReset().mockResolvedValue(undefined)
  
  await processor.run({ fileGroups, inputDir, outputDir })
  
  expect(vi.mocked(unlink)).toHaveBeenCalledWith("/test/src/style.ts.md")
});
```

## Integration with Gemini CLI

### Execution Pattern
```typescript
// Using ZX for shell command execution
import {$} from 'zx';

const runGemini = async (prompt: string) => {
  try {
    const result = await $`bunx @google/gemini-cli "${prompt}"`;
    return result.stdout;
  } catch (error) {
    // Handle authentication errors
    // Handle missing CLI errors
  }
};
```

### Error Handling
- Check for missing GEMINI_API_KEY environment variable
- Handle Gemini CLI not installed scenarios
- Implement exponential backoff for rate limiting

## Code Style Conventions

### TypeScript Patterns
- Strict mode enabled in tsconfig.json
- Path aliases: `@/*` maps to `./src/*`
- Prefer `type` over `interface` for type definitions
- Use arrow functions: `const fn = () => {}`
- Functional style over class-based approach

### React/Ink Components
```typescript
// Component definition pattern
type MyComponentProps = {
  prop1: string;
  prop2?: number;
};

export const MyComponent: React.FC<MyComponentProps> = ({prop1, prop2 = 0}) => {
  return <Text>{prop1}: {prop2}</Text>;
};
```

### File Organization
- One component per file
- Co-locate types with implementation
- Export types alongside implementations
- Use named exports (avoid default exports)

## Build and Development Workflow

### Development Mode
- `just dev` - Runs bunup in watch mode
- Auto-recompiles on file changes
- Outputs to `dist/` directory

### Building
- `just build` - Production build
- TypeScript compilation via bunup
- Generates type definitions

### Testing Workflow
1. `just test [args]` - Run tests with vitest (can pass file path or other args)
2. `just coverage` - Generate coverage report
3. Tests run automatically in CI/CD

### Code Quality
- `just fmt` - Format code with Biome (auto-fix with --write --unsafe)
- `just lint` - Lint code with Biome (check only with --unsafe)

### CLI Commands
- `just cli [args]` - Build and run the CLI with arguments
- `just claude [args]` - Run Claude CLI via bunx
- `just gemini [args]` - Run Gemini CLI via bunx
- `just publish <version>` - Publish package to npm

### CLI Flags
- `-i, --input` - Input directory to analyze (default: current directory)
- `-o, --output` - Output directory for style guides (default: ./context42)
- `-m, --model` - Gemini model to use (default: gemini-2.5-flash)
- `-c, --concurrency` - Number of concurrent operations (default: 4)
- `-r, --run` - Resume from a previous run ID
- `-d, --debug` - Debug mode - shows run ID on error and preserves it

## Environment Variables

- `GEMINI_API_KEY` - Required for Gemini CLI integration
- Loaded via dotenv from `.env` file
- Can be passed directly: `GEMINI_API_KEY=xxx bunx context42`

## Common Tasks

### Adding a New Command
1. Create command handler in appropriate module
2. Add Ink UI component if interactive
3. Update CLI router in `src/index.tsx`
4. Add tests for new functionality

### Updating Database Schema
1. Add migration logic in `database.ts`
2. Use `db.exec()` for DDL statements
3. Version migrations if needed
4. Update type definitions

### Adding New Worker Types
1. Extend worker pool in `processor.ts`
2. Implement task handler
3. Add progress tracking
4. Update UI components

### Debugging Failed Runs
1. Run with `--debug` flag to see run ID on errors
2. Check the database at `~/.context42/data.db` for partial results
3. Resume failed runs using `--run <run-id>`
4. All temporary `style.{ext}.md` files are automatically cleaned up

## Performance Considerations

- Worker pool size: Default 8, configurable via CLI
- Database operations are synchronous (better-sqlite3)
- File discovery uses efficient glob patterns
- React reconciliation optimized for terminal rendering

## Security Notes

- Database stored in user home directory
- No network requests except Gemini CLI calls
- Sensitive data (API keys) never logged
- File system access limited to specified directories
