import {defineConfig} from 'bunup';
import {exports} from 'bunup/plugins';

export default defineConfig({
	entry: ['src/index.tsx'],
	format: ['esm'],
	dts: true,
	plugins: [exports()],
});
