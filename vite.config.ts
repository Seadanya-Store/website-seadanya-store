import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/website-seadanya-store/',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    // --- TAMBAHKAN BLOK BUILD DI BAWAH INI ---
    build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Pisahkan heic-converter ke chunk sendiri (lazy loaded)
          if (id.includes('heic-convert') || id.includes('heic2any')) {
            return 'heic-converter';
          }
          // Perbaiki circular chunk warning sekaligus
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler')) {
            return 'react-core';
          }
          if (id.includes('node_modules')) {
            return 'vendor-libs';
          }
        },
      },
    },
  },
  };
});