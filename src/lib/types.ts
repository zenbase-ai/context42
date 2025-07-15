// Base types for common patterns
export type Callback<T> = (value: T) => void;
export type AsyncCallback<T> = (value: T) => Promise<void>;

// Database types
export type DatabaseRow = {
	id: number;
	created_at: string;
};

export type GeminiResponse = DatabaseRow & {
	project_path: string;
	file_path: string;
	question: string;
	response: string;
	response_time: number;
};

export type StyleGuide = DatabaseRow & {
	project_path: string;
	language: string;
	content: string;
};

// Worker types
export type WorkerId = number;
export type WorkerStatus = 'idle' | 'working' | 'success' | 'error';

export type Worker = {
	id: WorkerId;
	status: WorkerStatus;
	directory?: string;
	language?: string;
	files?: number;
	processed?: number;
	error?: string;
};

export type WorkerUpdate = Pick<
	Worker,
	'status' | 'directory' | 'language' | 'files' | 'processed' | 'error'
>;

// File and language types
export const LANGUAGES = [
	'javascript',
	'typescript',
	'python',
	'ruby',
	'go',
	'java',
	'rust',
] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_EXTENSIONS: Record<Language, readonly string[]> = {
	javascript: ['.js', '.jsx', '.mjs', '.cjs'],
	typescript: ['.ts', '.tsx', '.mts', '.cts'],
	python: ['.py'],
	ruby: ['.rb'],
	go: ['.go'],
	java: ['.java'],
	rust: ['.rs'],
} as const;

export type FileGroup = {
	readonly directory: string;
	readonly language: Language;
	readonly files: readonly string[];
};

// Options types
export type BaseOptions = {
	onProgress?: Callback<number>;
	onError?: Callback<Error>;
};

export type ExplorerOptions = {
	directory: string;
	ignore?: readonly string[];
};

export type ProcessorOptions = BaseOptions & {
	concurrency?: number;
	rootPath: string;
	onWorkerUpdate?: Callback<Worker>;
	onProgress?: Callback<number>;
	model?: string;
};

// Processor interfaces
export type StyleGuideProcessor = {
	run(
		fileGroups: readonly FileGroup[],
		baseDirectory: string,
	): Promise<Map<string, string>>;
	reset(): void;
	workers: Worker[];
};

// Component prop types
export type WorkerStatusProps = {
	readonly workers: readonly Worker[];
};

export type ProgressBarProps = {
	readonly value: number;
	readonly max: number;
	readonly label?: string;
};

export type ExplorerStatusProps = {
	readonly fileGroups: readonly FileGroup[];
	readonly isLoading: boolean;
};

// CLI phase types
export const CLI_PHASES = ['explore', 'process', 'complete', 'error'] as const;
export type CLIPhase = (typeof CLI_PHASES)[number];
