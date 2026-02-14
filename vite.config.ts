import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { almostnodePlugin } from 'almostnode/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), almostnodePlugin()],
  base: '/',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      }
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'node:zlib': resolve(__dirname, './src/shims/node-zlib.ts'),
    },
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable manual chunking to prevent initialization issues
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  esbuild: {
    target: 'esnext',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
})
