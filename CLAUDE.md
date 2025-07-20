# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Principles

1. Frequently refer to PLAN.md for the project plan.
2. As you work, create a new log in .claude/logs/{plan-name}/{int}.md, where int is an increasing integer. You can reference previous logs. You'll have to create the directory.

## Project Overview

Context42 is a TypeScript CLI that generates style guides for codebases using Google Gemini AI. It analyzes code files, generates language-specific style documentation, and provides an interactive terminal UI built with Ink (React for CLIs).

## Development Commands

All commands use `just` (justfile). Key commands:

- `just dev` - Run tests in watch mode
- `just build` - Production build with esbuild
- `just cli [args]` - Build and run the CLI
- `just test [args]` - Run tests with vitest (can pass file paths)
- `just fmt` - Format code with Biome
- `just lint` - Lint code with Biome
- `just claude [args]` - Run Claude CLI via bunx
- `just gemini [args]` - Run Gemini CLI via bunx
- `just publish <version>` - Bump version and publish to npm

### CLI Usage

```bash
# Basic usage
just cli -i ./src -o ./docs

# Resume failed run
just cli --run <run-id>

# Debug mode (shows run ID)
just cli --debug

# Custom concurrency
just cli -c 8
```

## Architecture

### Core Modules

1. **Explorer** (`src/lib/explorer.ts`)
   - Discovers files using globby
   - Groups by language extension
   - Filters common ignore patterns
   - Returns structured FileInfo objects

2. **Processor** (`src/lib/processor.ts`)
   - Worker pool pattern with abort support
   - Dependency-aware processing (children before parents)
   - Automatic cleanup via file registry
   - Configurable concurrency (default: 4)
   - Task distribution and result collection

3. **Generator** (`src/lib/generator.ts`)
   - Creates Gemini prompts for style analysis
   - Executes via ZX shell commands
   - Handles rate limiting and errors
   - Parses AI responses

4. **Database** (`src/lib/database.ts`)
   - SQLite at `~/.context42/data.db`
   - Stores responses and style guides
   - Run ID-based session management
   - Resume capability via constructor

### UI Components (Ink/React)

- **App** (`src/components/App.tsx`) - Main orchestrator
- **ExplorerStatus** - File discovery progress
- **WorkerStatus** - Worker pool monitoring
- **ProgressBar** - Visual progress indicator
- **Table** - Results display

### Key Patterns

- **File Registry**: Tracks temporary files for guaranteed cleanup
- **Abort Controller**: Cancellable operations throughout
- **Run IDs**: UUID-based session tracking for resume
- **Worker Pool**: Concurrent processing with proper error handling
- **Dependency Ordering**: Process child directories before parents

## Code Style

- Arrow functions: `const fn = () => {}`
- React components: `const Component: React.FC<Props> = ({}) => {}`
- Prefer `type` over `interface`
- Functional style over classes
- Use path aliases: `@/*` → `./src/*`
- No default exports

## Testing

Tests use Vitest with mocking for external dependencies:

```typescript
// Mock Gemini CLI
vi.mocked($).mockResolvedValue({ stdout: 'response' })

// Mock file system
vi.mocked(writeFile).mockResolvedValue()

// In-memory database
const db = new DB(':memory:')
```

Run tests:
- `just test` - All tests
- `just test path/to/file` - Specific file
- `just coverage` - Coverage report

## Environment Setup

- Node.js 20+ (managed via mise.toml)
- `GEMINI_API_KEY` required for AI features
- ESM modules throughout
- Biome for formatting (2 spaces, double quotes)

## Error Handling

- Graceful shutdown on SIGINT/SIGTERM
- Comprehensive error messages in UI
- Automatic file cleanup on errors
- Database transaction safety
- Resume capability for failed runs

## Common Tasks

### Adding New File Types
1. Update `languageExtensions` in `explorer.ts`
2. Add test cases for new extensions
3. Consider grouping logic for related types

### Modifying Worker Behavior
1. Update `Processor` class in `processor.ts`
2. Ensure abort controller integration
3. Update progress tracking logic
4. Test concurrent scenarios

### Database Schema Changes
1. Add migration in `database.ts` init()
2. Update TypeScript types
3. Test with in-memory database
4. Consider backward compatibility