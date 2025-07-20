# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.3] - 2025-07-19

### Added
- Initial release of context42
- AI-powered code style guide generation using Google Gemini
- Support for multiple programming languages (TypeScript, Python, Go, Rust, JavaScript, etc.)
- Interactive CLI built with React and Ink for beautiful terminal UI
- Real-time progress tracking with worker status and queued tasks display
- SQLite database for caching Gemini responses and style guides
- Concurrent processing with configurable worker pool (default: 4, max: 8)
- Automatic file discovery and language detection using globby
- Style guide output to customizable directory (default: `./context42/`)
- Gemini model selection support (default: gemini-2.5-flash)
- Progress messages from Gemini analysis displayed in real-time
- Topological sorting for dependency-aware task processing
- Support for monorepos and multi-language projects

[0.3.3]: https://github.com/zenbase-ai/context42/releases/tag/v0.3.0
