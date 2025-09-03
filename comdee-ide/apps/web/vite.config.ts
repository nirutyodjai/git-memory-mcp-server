import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@comdee-ide/core': path.resolve(__dirname, '../../packages/core/src'),
      '@comdee-ide/ui-components': path.resolve(__dirname, '../../packages/ui-components/src'),
      '@comdee-ide/mcp-integration': path.resolve(__dirname, '../../packages/mcp-integration/src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@monaco-editor/react'],
  },
});