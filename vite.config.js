import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Performance optimizations
    minify: 'esbuild', // Faster than terser
    target: 'esnext', // Faster builds, modern browsers only
    sourcemap: false, // Disable sourcemaps for faster builds (enable if needed)
    rollupOptions: {
      output: {
        manualChunks: undefined, // Simpler chunking for faster builds
      },
    },
  },
  server: {
    port: 5173,
    host: true, // Allow external access (0.0.0.0)
    strictPort: false, // Try next available port if 5173 is taken
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@echo-company/echo-ui/styles': resolve(__dirname, '../Echo-UI/src/styles.css'),
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
