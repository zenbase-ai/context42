import { expect, test } from 'vitest';
import {
  closeDatabase,
  getDatabase,
  getRecentResponses,
  getStyleGuide,
  saveGeminiResponse,
  saveStyleGuide,
} from '../src/lib/database';

test('database operations work correctly', async () => {
	const db = getDatabase();
	expect(db).toBeTruthy();

	// Test saving and retrieving Gemini responses
	saveGeminiResponse('Test prompt', 'Test result');
	const responses = getRecentResponses(1);

	const response = responses[0]!;
	expect(response).toBeDefined();
	expect(response.question).toBe('Test prompt');
	expect(response.response).toBe('Test result');
	expect(response.created_at).toBeTruthy();

	// Test saving and retrieving style guides
	saveStyleGuide('ts', '# TypeScript Style Guide', '/test/dir');
	const guide = getStyleGuide('ts', '/test/dir');

	expect(guide).toBeTruthy();
	expect(guide?.language).toBe('ts');
	expect(guide?.content).toBe('# TypeScript Style Guide');
	expect(guide?.project_path).toBe('/test/dir');

	// Test updating existing style guide
	saveStyleGuide('ts', '# Updated TypeScript Style Guide', '/test/dir');
	const updatedGuide = getStyleGuide('ts', '/test/dir');

	expect(updatedGuide?.content).toBe('# Updated TypeScript Style Guide');

	closeDatabase();
});
