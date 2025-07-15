#!/bin/bash

# Test script for Context42 CLI

# Build first
echo "Building..."
just build

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "Error: GEMINI_API_KEY environment variable is not set"
    echo "Please set it: export GEMINI_API_KEY='your-api-key'"
    exit 1
fi

# Run with default options (current directory)
echo -e "\n1. Testing with defaults (current directory)..."
node dist/cli.js

# Run with specific input directory
echo -e "\n2. Testing with specific input directory..."
node dist/cli.js -i src/

# Run with specific output directory
echo -e "\n3. Testing with specific output directory..."
node dist/cli.js -o ./test-output/

# Show help
echo -e "\n4. Showing help..."
node dist/cli.js --help
