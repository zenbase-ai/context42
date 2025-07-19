import path, { dirname, relative } from "node:path"
import { llml } from "@zenbase/llml"
import { backOff } from "exponential-backoff"
import { $ } from "zx"

const executor = ((): string => {
  const runner = process.argv[0]
  if (!runner) {
    throw new Error("Unexpected error: Please file an issue.")
  }

  const binDir = path.dirname(runner)

  if (runner.includes("pnpm")) {
    return path.join(binDir, "pnpx")
  }
  return path.join(binDir, "npx")
})()

export type GenerateStyleGuideOptions = {
  model: string
  files: string[]
  language: string
  childStyleGuides?: Record<string, string> // relative-dir -> style guide content
  onProgress?: (message: string) => void
  signal?: AbortSignal
}

export const generateStyleGuide = async ({
  model,
  files,
  language,
  childStyleGuides,
  onProgress,
  signal,
}: GenerateStyleGuideOptions): Promise<void> => {
  if (files.length === 0) {
    throw new Error(`No ${language} files found to analyze`)
  }

  // The language IS the extension now
  const fileExtension = language

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
  // Detect synthesis mode
  const isSynthesisMode = childStyleGuides && Object.keys(childStyleGuides).length > 0

  const prompt = llml({
    role: "Code Anthropologist & Style Detective",
    task: isSynthesisMode
      ? "Synthesize a masterful style guide by studying how architectural patterns flow across subdirectories, revealing the developer's complete coding philosophy and decision-making framework."
      : "Decode the developer's unique coding DNA by forensically analyzing their patterns, preferences, unconscious habits, and the subtle decisions that make their code distinctively theirs.",
    mission:
      "Create a style guide so precise and insightful that an AI agent can seamlessly mimic the developer's coding style, making contributions indistinguishable from the original author. This guide should capture not just WHAT they code, but HOW they think.",
    fileCreationInstruction: {
      importantNote: `**IMPORTANT**: Create a file named 'style.${fileExtension}.md' in the current working directory with the following structure:`,
      steps: [
        {
          step: "Start with YAML frontmatter (between triple dashes), example:",
          example: {
            yamlFrontmatter: [
              `---
          description: ${fileExtension} Style Guide
          globs: **/*.${fileExtension}
          alwaysApply: false
          ---`,
            ],
          },
        },
        {
          step: "Follow the frontmatter with the complete style guide analysis below.",
        },
      ],
      progressInstructions: {
        description:
          "Output progress updates during analysis by prefixing lines with [PROGRESS]. Before beginning with the actual analysis, output a [PROGRESS] with something whimsical and playful.",
        goal: "Make the user feel happy engaged, and occassionally laugh.",
        examples: [
          "[PROGRESS] Sneaking past legacy code traps armed only with a rubber duck...",
          "[PROGRESS] Whispering sweet nothings to the linter (it never listens, but we try)",
          "[PROGRESS] Bribing the import sorter with coffee and promises of fewer circular deps",
          "[PROGRESS] Translating cryptic TODOs into ancient developer runes...",
          "[PROGRESS] Playing hide-and-seek with global variables (they always win)",
          "[PROGRESS] Summoning the spirit of clean code with a ritual of semicolons and whitespace",
          "[PROGRESS] Refactoring spaghetti into lasagna—layer by delicious layer",
        ],
        requires: ["fun", "whimsy", "playful", "engaging"],
        rules: ["the user will only see the first line of [PROGRESS]"],
      },
    },
    context: {
      directory: baseDir,
      fileCount: files.length,
      files: [...files.map(f => relative(baseDir, f))].join("\n"),
      deepAnalysisRequired: true,
      captureSubtlePatterns: true,
      revealImplicitKnowledge: true,
      ...(isSynthesisMode && {
        synthesisMode: true,
        childDirectories: Object.keys(childStyleGuides).length,
        synthesisNote:
          "This is a synthesis task - reveal the emergent philosophy and patterns that unite all subdirectories into a coherent whole.",
      }),
    },
    childStyleGuides: childStyleGuides || undefined,
    analysisFramework: {
      "Layer 1: Surface Patterns": [
        "Variable/function/class naming conventions (including abbreviations, compound words, domain terms)",
        "File naming and organization patterns",
        "Import statement organization and grouping logic",
        "Comment style, placement, and density",
        "Code spacing and visual rhythm preferences",
        "Bracket placement and indentation philosophy",
      ],
      "Layer 2: Architectural Patterns": [
        "Module boundaries and responsibility distribution",
        "Dependency injection and inversion of control approaches",
        "State management philosophy (immutable vs mutable, local vs global)",
        "Error handling strategies and exception philosophy",
        "API design principles (REST vs GraphQL patterns, naming conventions)",
        "Data flow patterns and transformation approaches",
        "Abstraction layers and interface design",
        "Service/component communication patterns",
      ],
      "Layer 3: Developer Psychology": [
        "Problem decomposition approach (top-down vs bottom-up)",
        "Abstraction threshold (when they choose to DRY vs WET)",
        "Performance vs readability trade-off decisions",
        "Testing philosophy (unit vs integration preference, coverage goals)",
        "Documentation depth and style (when/what/how they document)",
        "Defensive programming tendencies",
        "Refactoring triggers and patterns",
        "Code review focus areas",
      ],
      "Layer 4: Domain-Specific Patterns": [
        "Business logic organization and encapsulation",
        "Domain terminology usage and modeling",
        "Industry-specific patterns and conventions",
        "Custom abstractions and their evolution",
        "Performance optimizations specific to the problem domain",
        "Security patterns and threat modeling approach",
      ],
    },
    outputSections: {
      "# 1. CORE PHILOSOPHY":
        "The developer's fundamental beliefs about good code, their values, and what they optimize for",
      "# 2. NAMING PATTERNS":
        "Comprehensive naming conventions with decision trees for different contexts (when to abbreviate, how to handle compound words, domain term usage)",
      "# 3. CODE ORGANIZATION":
        "How code is structured from project level down to function internals, including file boundaries and module responsibilities",
      "# 4. ERROR HANDLING": "Complete approach to errors, edge cases, validation, and defensive coding strategies",
      "# 5. STATE MANAGEMENT": "How state is organized, accessed, mutated, and synchronized across the application",
      "# 6. API DESIGN": "Patterns for internal and external APIs, including naming, versioning, and contract design",
      "# 7. TESTING APPROACH": "Testing philosophy, patterns, coverage goals, and what they consider worth testing",
      "# 8. PERFORMANCE PATTERNS":
        "When and how performance is prioritized, common optimizations, and measurement approaches",
      "# 9. ANTI-PATTERNS": "What the developer explicitly avoids and why, with examples of rejected approaches",
      "# 10. DECISION TREES":
        "When to use pattern A vs pattern B, with clear criteria for choosing between alternatives",
      "# 11. AI AGENT INSTRUCTIONS":
        "Step-by-step guide for AI agents to write code in this style, including pre-flight checklist and review criteria",
    },
    detectionStrategies: [
      "Find patterns that appear 3+ times - these reveal intentional choices",
      "Identify naming patterns beyond simple case conventions (abbreviation rules, compound word handling)",
      "Detect implicit hierarchies and boundaries in code organization",
      "Recognize custom abstractions and understand their purpose and evolution",
      "Spot error handling consistency and philosophy across different contexts",
      "Analyze comment patterns to understand documentation philosophy",
      "Identify performance optimizations vs readability choices and the criteria used",
      "Look for patterns in how external dependencies are wrapped or used",
      "Notice patterns in test structure and what gets tested vs what doesn't",
      "Detect code smells the developer consistently avoids",
    ],
    exampleRequirements: {
      quantity: "Every pattern MUST include 2-3 real code examples from the actual codebase",
      comparison: "Show the pattern alongside what it's NOT (anti-examples) to clarify boundaries",
      rationale: "Explain WHY this pattern exists in THIS specific codebase and problem domain",
      evolution: "If possible, show how patterns vary in different contexts or have evolved",
      specificity: "Use exact code snippets, not simplified examples",
    },
    aiAgentGuidance: {
      preWriteChecklist: [
        "Review relevant existing code in the same module/directory",
        "Identify the abstraction level and patterns used nearby",
        "Check naming conventions for similar concepts",
        "Determine error handling approach for this context",
        "Consider performance vs readability trade-offs",
      ],
      writingProcess: [
        "Start with the problem decomposition approach typical for this developer",
        "Apply naming patterns consistently with existing code",
        "Structure code following established organizational patterns",
        "Implement error handling using identified strategies",
        "Add comments/documentation matching the developer's style",
      ],
      reviewCriteria: [
        "Does it feel like it belongs in this codebase?",
        "Are naming patterns consistent with existing code?",
        "Is the abstraction level appropriate for the context?",
        "Does error handling match established patterns?",
        "Would the original developer make the same choices?",
      ],
    },
    analysisInstructions: isSynthesisMode
      ? [
          "PRIMARY: Synthesize the complete coding philosophy from child directory patterns",
          "Identify the core principles that unite all subdirectories",
          "Reveal how local patterns contribute to the global architecture",
          "Map the flow of ideas and patterns across directory boundaries",
          "Extract the mental model that guides all architectural decisions",
          "Show how different subsystems embody the same core philosophy differently",
          "Create a unified theory of the developer's coding approach",
          "Identify evolution patterns - how the style has matured across the codebase",
        ]
      : [
          "Perform forensic analysis on ALL files to decode the developer's style DNA",
          "Focus on the WHY behind every pattern - what problem does it solve?",
          "Identify the developer's mental model and problem-solving approach",
          "Detect subtle patterns that reveal unconscious preferences",
          "Map the decision criteria used for architectural choices",
          "Uncover the hidden rules that make code 'feel right' to this developer",
          "Identify patterns unique to this codebase vs general best practices",
          "Reveal the developer's priorities through their trade-off decisions",
        ],
    guardrails: isSynthesisMode
      ? [
          "Every synthesized pattern must emerge from actual child style guides",
          "Explain how local patterns serve the global architecture",
          "Focus on philosophy and principles, not implementation details",
          "Show how patterns evolved and adapted across subdirectories",
          "Create actionable guidance for system-wide development",
          "Reveal the 'why' behind architectural decisions that span directories",
          "Build a coherent narrative, not a pattern catalog",
        ]
      : [
          "Every pattern must be evidenced by actual code (no speculation)",
          "Explain the problem each pattern solves in this specific context",
          "Distinguish between intentional patterns and coincidences",
          "Focus on patterns that require human judgment to apply",
          "Make the implicit explicit without losing nuance",
          "Capture the 'feel' of the code, not just the mechanics",
          "Enable AI agents to make the same decisions the developer would",
        ],
    tips: isSynthesisMode
      ? [
          "Look for the philosophical thread that connects all directories",
          "Identify how global principles manifest differently in each context",
          "Notice evolutionary patterns - how style changed over time",
          "Find the core mental model that drives all decisions",
          "Reveal the unwritten rules that govern the entire system",
        ]
      : [
          "Study code like an anthropologist studies culture",
          "Look for rituals and repeated ceremonies in the code",
          "Identify the developer's 'signature moves' and favorite patterns",
          "Notice what's NOT there - avoided patterns are as revealing as used ones",
          "Find the moments where the developer chose simplicity vs cleverness",
          "Detect the developer's personal style beyond team conventions",
        ],
  })

  try {
    await backOff(
      async () => {
        // Check if already aborted
        if (signal?.aborted) {
          throw new Error("Operation cancelled")
        }

        // Run gemini-cli directly without shell wrapper
        const p = $({
          cwd: baseDir,
          input: prompt,
          signal,
        })`${executor} @google/gemini-cli --yolo -m ${model} -a`

        // Stream stdout and parse progress messages
        try {
          for await (const chunk of p.stdout) {
            // Check if aborted during streaming
            if (signal?.aborted) {
              p.kill()
              throw new Error("Operation cancelled")
            }

            const lines = chunk.toString().split("\n")
            for (const line of lines) {
              if (line.startsWith("[PROGRESS]")) {
                const message = line.substring(10).trim()
                onProgress?.(message)
              }
            }
          }

          // Wait for process to complete
          await p
        } catch (error) {
          // Kill the process if still running
          p.kill()
          throw error
        }
      },
      {
        numOfAttempts: 3,
        timeMultiple: 2,
        startingDelay: 2000,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    // biome-ignore lint/suspicious/noExplicitAny: Error logging is intentional
    const stderr = (error as any).stderr || ""

    if (signal?.aborted) {
      throw new Error("Operation cancelled")
    }

    if (stderr.includes("rate limit")) {
      throw new Error("Gemini API rate limit exceeded. Exponential backoff failed. Please wait and try again.")
    }

    throw new Error(`Gemini command failed: ${stderr || errorMessage}`)
  }
}
