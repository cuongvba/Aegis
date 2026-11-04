import { defineConfig } from 'vite';
import react            from '@vitejs/plugin-react';
import tailwindcss      from '@tailwindcss/vite';
import { resolve }      from 'path';
import pkg              from './package.json';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  // ── Define global constants ──────────────────────────────────────
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },

  // ── Dev Server ──────────────────────────────────────────────────
  server: {
    port: 3000,
    proxy: {
      // Proxy tất cả /api requests về AegisQuiz backend
      '/api': {
        target:      process.env.VITE_API_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
      // SignalR proctoring hub (WebSocket)
      '/hubs': {
        target:      process.env.VITE_API_URL || 'http://localhost:8080',
        changeOrigin: true,
        ws:           true,
      },
    },
  },

  // ── Build Optimization (World-Class Chunk Splitting) ─────────────
  build: {
    target:    'es2022',
    sourcemap:  false,
    chunkSizeWarningLimit: 400,

    rollupOptions: {
      output: {
        manualChunks(id: string) {
          const normId = id.replace(/\\/g, '/');
          if (normId.endsWith('.css')) return undefined;

          // 1. Vendor Isolation (Normalized Cross-Platform Paths)
          if (normId.includes('node_modules/react/') || normId.includes('node_modules/react-dom/') || normId.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          if (normId.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-query';
          }
          if (normId.includes('node_modules/@microsoft/signalr')) {
            return 'vendor-signalr';
          }
          if (normId.includes('node_modules/katex') || normId.includes('/shared/lib/quiz/wmfDecoder') || normId.includes('/components/common/MathRenderer')) {
            return 'vendor-katex';
          }
          if (normId.includes('node_modules/d3-') || normId.includes('node_modules/victory-vendor') || normId.includes('node_modules/react-smooth') || normId.includes('node_modules/recharts-scale')) {
            return 'vendor-d3';
          }
          if (normId.includes('node_modules/recharts/es6/cartesian') || normId.includes('node_modules/recharts/lib/cartesian')) {
            return 'vendor-recharts-cartesian';
          }
          if (normId.includes('node_modules/recharts')) {
            return 'vendor-recharts';
          }
          if (normId.includes('node_modules/i18next') || normId.includes('node_modules/react-i18next')) {
            return 'vendor-i18n';
          }
          if (normId.includes('node_modules/zod')) {
            return 'vendor-zod';
          }
          if (normId.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (normId.includes('node_modules/axios')) {
            return 'vendor-axios';
          }

          // 2. Admin Ingestion Studios Isolation (On-Demand Micro-Bundles <= 250kB)
          if (normId.includes('/admin/questions/components/docx/useDocxPreviewState') || normId.includes('/admin/questions/components/docx/DocxTaxonomyBar')) {
            return 'admin-docx-state';
          }
          if (normId.includes('/admin/questions/components/docx/')) {
            return 'admin-docx-studio';
          }
          if (normId.includes('/admin/questions/components/ExcelIngestionStudioModal')) {
            return 'admin-excel-studio';
          }
          if (normId.includes('/admin/questions/components/RuleStudioTab')) {
            return 'admin-cig-studio';
          }
          if (normId.includes('/admin/questions/components/BulkTaxonomyModal')) {
            return 'admin-taxonomy-studio';
          }
        },
      },
    },
  },
});
