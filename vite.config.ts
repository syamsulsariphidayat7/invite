import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Runtime eksplisit supaya build lokal tidak terikat versi Node mesin
			// (Vercel menjalankan fungsi Node sesuai runtime yang dipilih di sini).
			// Region sin1 (Singapore) — satu region dengan Supabase ap-southeast-1.
			adapter: adapter({ runtime: 'nodejs24.x', regions: ['sin1'] })
		})
	]
});
