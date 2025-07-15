import { dirname } from "node:path"
import { llml } from "@zenbase/llml"
import { backOff } from "exponential-backoff"
import { $ } from "zx"

const executor = ((): string => {
  const runner = process.argv[0] ?? ""
  if (runner.includes("bun")) {
    return "bunx"
  }
  if (runner.includes("pnpm")) {
    return "pnpx"
  }
  if (runner.includes("yarn")) {
    return "yarn dlx"
  }
  return "npx"
})()

export type GenerateStyleGuideOptions = {
  model: string
  files: string[]
  language: string
}

export const generateStyleGuide = async ({
  model,
  files,
  language,
}: GenerateStyleGuideOptions): Promise<string> => {
  if (files.length === 0) {
    throw new Error(`No ${language} files found to analyze`)
  }

  // Create a prompt for style guide generation
  const languageNames: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    ruby: "Ruby",
    go: "Go",
    java: "Java",
    rust: "Rust",
    tsx: "TypeScript React",
    jsx: "JavaScript React",
  }

  const languageName = languageNames[language] || language.toUpperCase()

  // Get the common base directory from all files
  const getCommonDirectory = (filePaths: string[]): string => {
    if (filePaths.length === 0) return process.cwd()
    if (filePaths.length === 1) return dirname(filePaths[0]!)

    const dirs = filePaths.map(f => dirname(f))
    let commonDir = dirs[0]!

    for (const dir of dirs) {
      while (!dir.startsWith(commonDir)) {
        commonDir = dirname(commonDir)
      }
    }

    return commonDir
  }

  const baseDir = getCommonDirectory(files)
  const escapedDir = baseDir.replace(/'/g, "'\\''")

  const prompt = llml({
    role: "Genius Programmer",
    task: "Create a comprehensive, actionable style guide based on the user's code.",
    context: {
      language: languageName,
      fileCount: files.length,
      directory: baseDir,
      audience: "development team",
      goalAlignment: "consistency and maintainability",
    },
    rules: ["Always read files, never execute them."],
    analysisInstructions: [
      "Analyze ALL files holistically to identify patterns",
      "Focus on what the codebase actually does, not theoretical best practices",
      "Identify the most common patterns as the standard",
      "Note any inconsistencies between files",
      "Extract project-specific conventions",
    ],
    requiredSections: {
      Overview: {
        description: "Brief summary of the codebase style philosophy",
        include: ["Primary language features used", "Overall code organization approach", "Key architectural patterns"],
      },
      "File Organization": {
        description: "How files and directories are structured",
        include: [
          "Directory structure patterns",
          "File naming conventions",
          "Module organization",
          "Test file placement",
          "Index file usage patterns",
        ],
      },
      "Naming Conventions": {
        description: "All naming patterns used in the codebase",
        include: [
          "Variables (local, global, constants)",
          "Functions and methods",
          "Classes, interfaces, and types",
          "Files and directories",
          "Test names",
          "Component names (if applicable)",
        ],
      },
      "Code Formatting": {
        description: "Formatting and syntax preferences",
        include: [
          "Indentation (tabs/spaces, size)",
          "Line length limits",
          "Bracket placement",
          "Semicolon usage",
          "Quote preferences",
          "Comma patterns (trailing, etc)",
          "Whitespace conventions",
        ],
      },
      "Type System": {
        description: "Type usage patterns (if applicable)",
        include: [
          "Type annotation patterns",
          "Interface vs type preferences",
          "Generic patterns",
          "Union and intersection types",
          "Type guards and assertions",
          "Null/undefined handling",
        ],
      },
      "Functions and Methods": {
        description: "Function definition and usage patterns",
        include: [
          "Arrow functions vs function declarations",
          "Parameter patterns",
          "Return type annotations",
          "Async/await usage",
          "Error handling in functions",
          "Function composition patterns",
        ],
      },
      "Import/Export Patterns": {
        description: "Module system usage",
        include: [
          "Import statement ordering",
          "Grouping of imports",
          "Named vs default exports",
          "Barrel exports usage",
          "Circular dependency handling",
          "Path aliases usage",
        ],
      },
      "Error Handling": {
        description: "Error management strategies",
        include: [
          "Try-catch patterns",
          "Error types used",
          "Error propagation",
          "Validation approaches",
          "Logging patterns",
          "Error recovery strategies",
        ],
      },
      "Testing Patterns": {
        description: "Testing approach and conventions",
        include: [
          "Test file organization",
          "Test naming conventions",
          "Assertion patterns",
          "Mock/stub usage",
          "Test data patterns",
          "Coverage expectations",
        ],
      },
      "Comments and Documentation": {
        description: "Documentation practices",
        include: [
          "Comment style and placement",
          "JSDoc/TSDoc usage",
          "TODO/FIXME conventions",
          "README patterns",
          "Inline documentation",
          "API documentation style",
        ],
      },
      "Project-Specific Patterns": {
        description: "Unique patterns in this codebase",
        include: [
          "Custom utilities or helpers",
          "Domain-specific patterns",
          "Framework-specific conventions",
          "Build tool configurations",
          "Environment handling",
          "Feature flags or toggles",
        ],
      },
    },
    outputFormat: {
      style: "markdown",
      structure: "hierarchical with examples",
      tone: "prescriptive but explanatory",
      examples: "include real code snippets from analyzed files",
    },
    guardrails: [
      "Every rule must be based on actual code patterns found",
      "Include specific examples from the codebase",
      "Prioritize consistency over theoretical best practices",
      "Make rules actionable and unambiguous",
      "If patterns conflict, note the most common approach",
      "Avoid generic advice - be specific to THIS codebase",
    ],
    tips: [
      "Use clear rule names that can be reference",
      "Include 'DO' and 'DON'T' examples where helpful",
      "Make rules specific enough to be automatically applied",
    ],
  })

  try {
    // Set quiet mode to suppress zx output
    const shell = process.env.SHELL || "/bin/bash"
    const cmd = `cd '${escapedDir}' && ${executor} @google/gemini-cli --yolo -m ${model} -a`
    console.log(cmd)
    const result = await backOff(() => $({ input: prompt })`${shell} -c ${cmd}`, {
      numOfAttempts: 5,
      timeMultiple: 2,
      startingDelay: 1000,
    })
    return result.text()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const stderr = (error as any).stderr || ""

    if (stderr.includes("rate limit")) {
      throw new Error("Gemini API rate limit exceeded. Exponential backoff failed. Please wait and try again.")
    }

    throw new Error(`Gemini command failed: ${stderr || errorMessage}`)
  }
}
