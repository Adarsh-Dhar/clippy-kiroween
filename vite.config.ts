import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react', 'clippyjs'],
  },
  resolve: {
    alias: {
      events: 'events',
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
});
