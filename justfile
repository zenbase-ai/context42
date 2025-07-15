set dotenv-load := true
set dotenv-path := ".env"
set ignore-comments := true

claude *args:
  bunx @anthropic-ai/claude-code {{args}}

gemini *args:
  bunx @google/gemini-cli {{args}}

dev:
  bun run bunup --watch

build:
  bun run bunup

fmt:
  biome check --write --unsafe

lint:
  biome check --unsafe

test:
  bun run vitest --run

coverage:
  bun run vitest --coverage

publish version:
  pnpm version {{version}}
  bun publish --access public

cli *args: build
  bun run dist/index.js {{args}}
