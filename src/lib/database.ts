import Database from 'better-sqlite3';
import {mkdirSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import type {GeminiResponse, StyleGuide} from './types.ts';

let db: Database.Database | null = null;

export const getDatabase = (): Database.Database => {
	if (db) return db;

	const dataDir = join(homedir(), '.context42');
	mkdirSync(dataDir, {recursive: true});

	const dbPath = join(dataDir, 'data.db');
	db = new Database(dbPath);

	// Create tables if they don't exist
	db.exec(`
		CREATE TABLE IF NOT EXISTS responses (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			prompt TEXT NOT NULL,
			result TEXT NOT NULL,
			created_at DATETIME NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at DESC);

		CREATE TABLE IF NOT EXISTS style_guides (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			language TEXT NOT NULL,
			content TEXT NOT NULL,
			directory TEXT NOT NULL,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_style_guides_language ON style_guides(language);
		CREATE INDEX IF NOT EXISTS idx_style_guides_directory ON style_guides(directory);
	`);

	return db;
};

export const saveGeminiResponse = (prompt: string, result: string): void => {
	const database = getDatabase();
	const stmt = database.prepare(
		'INSERT INTO responses (prompt, result, created_at) VALUES (?, ?, ?)',
	);
	stmt.run(prompt, result, new Date().toISOString());
};

export const getRecentResponses = (limit = 10): GeminiResponse[] => {
	const database = getDatabase();
	const stmt = database.prepare(
		'SELECT * FROM responses ORDER BY created_at DESC LIMIT ?',
	);
	const rows = stmt.all(limit) as Array<{
		id: number;
		prompt: string;
		result: string;
		created_at: string;
	}>;

	return rows.map(row => ({
		id: row.id,
		project_path: process.cwd(), // Using current working directory as project path
		file_path: '', // Not applicable for general responses
		question: row.prompt,
		response: row.result,
		response_time: 0, // Not tracked in current schema
		created_at: row.created_at,
	}));
};

export const saveStyleGuide = (
	language: string,
	content: string,
	directory: string,
): void => {
	const database = getDatabase();
	const now = new Date().toISOString();

	// Check if style guide exists for this language and directory
	const existing = database
		.prepare('SELECT id FROM style_guides WHERE language = ? AND directory = ?')
		.get(language, directory) as {id: number} | undefined;

	if (existing) {
		// Update existing
		const stmt = database.prepare(
			'UPDATE style_guides SET content = ?, updated_at = ? WHERE id = ?',
		);
		stmt.run(content, now, existing.id);
	} else {
		// Insert new
		const stmt = database.prepare(
			'INSERT INTO style_guides (language, content, directory, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
		);
		stmt.run(language, content, directory, now, now);
	}
};

export const getStyleGuide = (
	language: string,
	directory: string,
): StyleGuide | null => {
	const database = getDatabase();
	const stmt = database.prepare(
		'SELECT * FROM style_guides WHERE language = ? AND directory = ? ORDER BY updated_at DESC LIMIT 1',
	);
	const row = stmt.get(language, directory) as
		| {
				id: number;
				language: string;
				content: string;
				directory: string;
				created_at: string;
				updated_at: string;
		  }
		| undefined;

	if (!row) return null;

	return {
		id: row.id,
		project_path: row.directory,
		language: row.language,
		content: row.content,
		created_at: row.created_at,
	};
};

export const closeDatabase = (): void => {
	if (db) {
		db.close();
		db = null;
	}
};

// Handle process termination
process.on('exit', closeDatabase);
process.on('SIGINT', () => {
	closeDatabase();
	process.exit(0);
});
process.on('SIGTERM', () => {
	closeDatabase();
	process.exit(0);
});
