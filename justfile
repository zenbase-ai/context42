set dotenv-load := true
set dotenv-path := ".env"
set ignore-comments := true

claude *args:
  bunx @anthropic-ai/claude-code {{args}}

gemini *args:
  bunx @google/gemini-cli {{args}}

dev:
  pnpm vitest

build:
  node scripts/build.js

typecheck:
  pnpm tsc --noEmit

fmt:
  biome format --write && biome check --write --unsafe

lint:
  biome check --unsafe

test *args:
  pnpm vitest --run {{args}}

coverage:
  pnpm vitest --coverage

publish version: build
  pnpm version {{version}}
  pnpm publish --access public

cli *args:
  pnpm tsx src/main.tsx {{args}}
