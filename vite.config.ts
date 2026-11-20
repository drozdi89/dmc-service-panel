import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

/** Absolute project root — avoids Windows drive-letter case mismatches breaking Vitest. */
const root = fileURLToPath(new URL('./', import.meta.url));

/** Vite configuration for Service Panel Web UI with API proxy to dmcRestApi. */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  const apiTarget = env.VITE_API_PROXY_TARGET ?? 'http://localhost:8025';

  return {
    root,
    base: mode === 'production' ? '/admin/' : '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(root, 'src'),
      },
    },
    server: {
      host: env['VITE_SERVER_HOST'] || true,
			port: parseInt(env['VITE_SERVER_PORT'] || '3400', 10) || 3400,
			open: env['VITE_SERVER_OPEN'] === 'true',
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/info': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      root,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
      // Windows + Vite 8: default `threads`/`forks` can load a duplicate
      // @vitest/runner (drive-letter case) so `describe` runs with `runner` unset.
      pool: 'vmThreads',
    },
  };
});
