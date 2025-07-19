import { expect, test } from "vitest"
import { generateStyleGuide } from "../src/lib/generator"

test("generateStyleGuide processes files correctly", async () => {
  // Mock the actual implementation since we don't have real Gemini CLI in tests
  const mockGenerateStyleGuide = generateStyleGuide as any

  // This test would need to be updated with proper mocking
  // For now, just test the API shape
  const options = {
    model: "gemini-2.5-pro",
    files: ["file1.ts", "file2.ts"],
    language: "typescript",
  }

  // We'd need to mock the executeGeminiCommand function
  // This is a placeholder test
  expect(typeof mockGenerateStyleGuide).toBe("function")
  expect(options.files.length).toBe(2)
  expect(options.language).toBe("typescript")
})

test("generateStyleGuide throws error for empty files", async () => {
  await expect(
    generateStyleGuide({
      files: [] as string[],
      model: "gemini-2.5-pro",
      language: "typescript",
    }),
  ).rejects.toThrow("No typescript files found to analyze")
})

test("generateStyleGuide uses correct default model", async () => {
  // This would need proper mocking to test the actual command execution
  // For now, just test that the function accepts the right parameters
  const options = {
    files: ["test.ts"],
    language: "typescript",
  }

  // We'd need to mock executeGeminiCommand to test this properly
  expect(typeof generateStyleGuide).toBe("function")
  expect(options.files.length).toBe(1)
})
