import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/ws': {
        target: 'ws://127.0.0.1:3004',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err) => {
            // Gracefully handle backend restart without socket crash spam
          });
        },
      },
      '/api': {
        target: 'http://127.0.0.1:3004',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
