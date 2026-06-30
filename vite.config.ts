// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: process.env.CF_PAGES ? '/' : '/website-seadanya-store/',
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
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Hanya heic-converter yang dipisah — dia standalone & lazy-loaded,
            // tidak bergantung pada React sama sekali.
            if (id.includes('heic-convert') || id.includes('heic2any')) {
              return 'heic-converter';
            }
            // SEMUA node_modules lain (termasuk react, react-dom, recharts,
            // lucide-react, dll) digabung jadi SATU chunk vendor.
            // Ini mencegah circular dependency & masalah init order.
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
  };
});