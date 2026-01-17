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
    minify: 'esbuild', // Faster than terser, good compression
    target: 'esnext', // Faster builds, modern browsers only
    sourcemap: false, // Disable sourcemaps for smaller bundle
    cssCodeSplit: true, // Split CSS for better caching
    chunkSizeWarningLimit: 1000, // Warn on large chunks
    rollupOptions: {
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
      },
      output: {
        // Optimize chunk splitting for smaller bundles
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Separate React into its own chunk
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Don't create a separate vendor chunk to avoid circular dependencies
            // Let Vite handle other dependencies automatically
            return undefined;
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
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
