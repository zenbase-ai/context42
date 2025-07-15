# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Principles

1. Frequently refer to PLAN.md for the project plan.
2. As you work, create a new log in .claude/logs/{plan-name}/{int}.md, where int is an increasing integer. You can reference previous logs. You'll have to create the directory.

## Project Overview

Context42 is a TypeScript CLI project that is currently transitioning from an Oclif-based architecture (in the archive folder) to an Ink-based interactive CLI using React components. The project aims to integrate Google Gemini CLI for AI-powered code analysis and uses SQLite for local data persistence.

## Development Commands

### Build & Development

- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm dev` - Watch mode for development (compiles on changes)

### Testing

- `pnpm test` - Run tests with AVA and format/lint checks
- Tests use AVA with TypeScript support via ts-node loader
- Uses Prettier for formatting and XO for linting

### Running the CLI

- `pnpm run dev` - Development mode
- `just claude [args]` - Run Claude CLI
- `just gemini [args]` - Run Gemini CLI

## Architecture & Structure

### Important Patterns

1. The project uses ESM modules (type: "module" in package.json)
2. TypeScript is configured with strict mode and path aliases (@/_ -> ./src/_)
3. Database operations use SQLite with migrations stored in ~/.context42/data.db
4. Gemini CLI integration uses ZX for shell command execution with proper error handling for authentication and missing CLI scenarios

## Lint and Type Checking

While the current package.json only includes a test script that runs prettier and xo, the TypeScript compiler (tsc) is available for type checking via the build command.

## Rules

- Use `fd`, not `find`
- Use `rg`, not `grep`
- Use `const myFn = () => {}` instead of `function myFn() {}`
- Use `const MyComponent: React.FC<MyComponentProps> = ({}) => {}` instead of `const MyComponent = ({}: MyComponentProps) => {}`
- Prefer `type` to `interface`
- Prefer a lightweight functional style that minimizes lines of code vs. class based
