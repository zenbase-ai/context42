# context42

AI-powered code style guide generator. Analyzes your codebase(s) and creates language-specific style guides using Google Gemini.

**The best code style guide is the one your team already follows.** This tool discovers it.

## Demo

```bash
$ export GEMINI_API_KEY="..."
$ npx context42 # or bunx, pnpx, yarn dlx

 Exploring codebase...
 Processing 47 directories with Gemini
 Generated: ./context42/py.md, ./context42/ts.md, ./context42/go.md
```

## Install

```bash
npm install -g context42
```

## Usage

```bash
# Analyze current directory, saves results to ./context42/
context42

# Analyze specific directory
context42 -i src/

# Custom output location
context42 -o .cursor/rules/

# Set max concurrent Gemini processes (default: 8)
context42 --concurrency 4
```

## Why

Every codebase has implicit style rules. The problem is they're locked in developers' heads.

New team members guess. PRs get bikeshedded. Time gets wasted on "should we use `interface` or `type`?" when the answer is already in your code—if you look at the patterns.

Context42 makes the implicit explicit. It reads your code like a new developer would, but with perfect memory and pattern recognition.

## How it works

1. Recursively discovers code files in your project
2. Groups files by language extension
3. Runs up to 8 concurrent Gemini CLI processes to analyze code patterns
4. Generates style guides (py.md, ts.md, go.md, etc.) based on your actual code

Built with Ink (React for CLIs), better-sqlite3 for caching, and integrates Google's Gemini CLI via zx.

The output isn't aspirational—it's descriptive. This is how you actually write code.

## Development

```bash
pnpm install
pnpm dev          # Watch mode
pnpm test         # Run tests
pnpm build        # Build for production
```

Requires Node.js 16+ and a Gemini API key.

---

*"Good code has a rhythm. This tool finds it."*
