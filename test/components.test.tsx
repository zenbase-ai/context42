import {render} from 'ink-testing-library';
import {expect, test} from 'vitest';
import {ExplorerStatus} from '../src/components/ExplorerStatus';
import {ProgressBar} from '../src/components/ProgressBar';
import {WorkerStatus} from '../src/components/WorkerStatus';

test('ProgressBar renders correctly at 50%', () => {
	const {lastFrame} = render(<ProgressBar value={5} max={10} />);
	const output = lastFrame() ?? '';

	expect(output).toContain('5/10');
	expect(output).toContain('50%');
	expect(output).toContain('█'); // Progress filled
	expect(output).toContain('░'); // Progress empty
});

test('ProgressBar handles zero total', () => {
	const {lastFrame} = render(<ProgressBar value={0} max={0} />);
	const output = lastFrame() ?? '';

	expect(output).toContain('0/0');
	expect(output).toContain('0%');
});

test('ProgressBar handles 100% completion', () => {
	const {lastFrame} = render(<ProgressBar value={10} max={10} />);
	const output = lastFrame() ?? '';

	expect(output).toContain('10/10');
	expect(output).toContain('100%');
});

test('ExplorerStatus shows exploring state', () => {
	const {lastFrame} = render(
		<ExplorerStatus fileGroups={[]} isLoading={true} />,
	);
	const output = lastFrame() ?? '';

	expect(output).toContain('Exploring...');
});

test('ExplorerStatus shows completion state', () => {
	const fileGroups = [
		{
			directory: 'src',
			language: 'typescript' as const,
			files: ['a.ts', 'b.ts'],
		},
		{directory: 'tests', language: 'python' as const, files: ['test.py']},
		{directory: 'cmd', language: 'go' as const, files: ['main.go']},
	];
	const {lastFrame} = render(
		<ExplorerStatus fileGroups={fileGroups} isLoading={false} />,
	);
	const output = lastFrame() ?? '';

	expect(output).toContain('Exploration complete');
	expect(output).toContain('Found 4 files');
	expect(output).toContain('3 languages');
	expect(output).toContain('typescript, python, go');
});

test('WorkerStatus shows idle workers', () => {
	const workers = [
		{id: 1, status: 'idle' as const},
		{id: 2, status: 'idle' as const},
	];

	const {lastFrame} = render(<WorkerStatus workers={workers} />);
	const output = lastFrame() ?? '';

	expect(output).toContain('Worker 1:');
	expect(output).toContain('Worker 2:');
	expect(output).toContain('Idle');
});

test('WorkerStatus shows working state', () => {
	const workers = [
		{
			id: 1,
			status: 'working' as const,
			directory: 'src/components',
			language: 'ts',
		},
	];

	const {lastFrame} = render(<WorkerStatus workers={workers} />);
	const output = lastFrame() ?? '';

	expect(output).toContain('Worker 1:');
	expect(output).toContain('Processing ts files');
	expect(output).toContain('src/components');
});

test('WorkerStatus shows done state', () => {
	const workers = [
		{
			id: 1,
			status: 'success' as const,
			directory: 'src',
			language: 'typescript',
		},
	];

	const {lastFrame} = render(<WorkerStatus workers={workers} />);
	const output = lastFrame() ?? '';

	expect(output).toContain('✓ Completed src');
});

test('WorkerStatus shows error state', () => {
	const workers = [
		{
			id: 1,
			status: 'error' as const,
			error: 'API rate limit exceeded',
		},
	];

	const {lastFrame} = render(<WorkerStatus workers={workers} />);
	const output = lastFrame() ?? '';

	expect(output).toContain('✗ Failed:');
	expect(output).toContain('API rate limit exceeded');
});

test('WorkerStatus handles empty workers array', () => {
	const {lastFrame} = render(<WorkerStatus workers={[]} />);
	const output = lastFrame() ?? '';

	expect(output).toBe('');
});
