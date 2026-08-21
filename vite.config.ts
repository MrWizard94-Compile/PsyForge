/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      environment: 'happy-dom',
      globals: true,
      setupFiles: './src/setupTests.ts',
    },
    server: {
      // This flag is useful for low-noise local review sessions.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when HMR is deliberately disabled to save CPU.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:4317',
          changeOrigin: false,
          rewrite: (requestPath) => requestPath.replace(/^\/api/, ''),
        },
      },
    },
  };
});
