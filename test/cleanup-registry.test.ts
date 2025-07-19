import { existsSync } from "node:fs"
import { writeFile, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest"
import { cleanupRegistry, createFileCleanupHandler } from "../src/lib/cleanup-registry.js"

vi.mock("node:fs/promises", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs/promises")>()
	return {
		...actual,
		unlink: vi.fn(actual.unlink),
	}
})

describe("CleanupRegistry", () => {
	beforeEach(() => {
		cleanupRegistry.reset()
	})

	afterEach(() => {
		cleanupRegistry.reset()
	})

	test("registers and unregisters handlers", () => {
		let called = false
		const handler = () => {
			called = true
		}

		const unregister = cleanupRegistry.register(handler)
		expect(called).toBe(false)

		unregister()
		// Handler should not be called after unregistering
		cleanupRegistry.cleanup()
		expect(called).toBe(false)
	})

	test("calls all registered handlers on cleanup", async () => {
		const calls: number[] = []

		cleanupRegistry.register(() => calls.push(1))
		cleanupRegistry.register(() => calls.push(2))
		cleanupRegistry.register(async () => {
			await new Promise(resolve => setTimeout(resolve, 10))
			calls.push(3)
		})

		await cleanupRegistry.cleanup()
		expect(calls).toEqual([1, 2, 3])
	})

	test("handles errors in cleanup handlers", async () => {
		const calls: number[] = []
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

		cleanupRegistry.register(() => calls.push(1))
		cleanupRegistry.register(() => {
			throw new Error("Test error")
		})
		cleanupRegistry.register(() => calls.push(2))

		await cleanupRegistry.cleanup()
		expect(calls).toEqual([1, 2])
		expect(consoleSpy).toHaveBeenCalledWith("Cleanup handler error:", expect.any(Error))

		consoleSpy.mockRestore()
	})

	test("prevents multiple cleanup calls", async () => {
		let callCount = 0
		cleanupRegistry.register(() => callCount++)

		await cleanupRegistry.cleanup()
		await cleanupRegistry.cleanup()
		await cleanupRegistry.cleanup()

		expect(callCount).toBe(1)
	})

	test("createFileCleanupHandler removes files", async () => {
		const testDir = join(tmpdir(), `context42-test-${Date.now()}`)
		await mkdir(testDir, { recursive: true })

		const file1 = join(testDir, "test1.md")
		const file2 = join(testDir, "test2.md")
		const file3 = join(testDir, "test3.md")

		await writeFile(file1, "content 1")
		await writeFile(file2, "content 2")
		await writeFile(file3, "content 3")

		const files = new Set([file1, file2, file3])
		const handler = createFileCleanupHandler(files)

		expect(existsSync(file1)).toBe(true)
		expect(existsSync(file2)).toBe(true)
		expect(existsSync(file3)).toBe(true)

		await handler()

		expect(existsSync(file1)).toBe(false)
		expect(existsSync(file2)).toBe(false)
		expect(existsSync(file3)).toBe(false)
	})

	test("createFileCleanupHandler ignores non-existent files", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
		const files = new Set(["/non/existent/file1.md", "/non/existent/file2.md"])

		const handler = createFileCleanupHandler(files)
		await handler()

		// Should not log errors for ENOENT
		expect(consoleSpy).not.toHaveBeenCalled()
		consoleSpy.mockRestore()
	})

	test("createFileCleanupHandler logs non-ENOENT errors", async () => {
		const { unlink } = await import("node:fs/promises")
		vi.mocked(unlink).mockRejectedValueOnce(
			Object.assign(new Error("Permission denied"), { code: "EPERM" })
		)

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
		
		const files = new Set(["/some/file.md"])
		const handler = createFileCleanupHandler(files)
		await handler()

		expect(consoleSpy).toHaveBeenCalledWith(
			"Failed to clean up /some/file.md:",
			"Permission denied"
		)
		
		consoleSpy.mockRestore()
		vi.mocked(unlink).mockRestore()
	})
})