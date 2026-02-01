import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE || '/',
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: false, // Using static manifest file in public/
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
    // Strip CSP meta tag in dev mode -- Vite injects inline scripts for HMR
    // that are blocked by the strict script-src policy. CSP is only needed in
    // production builds where inline scripts are not present.
    // Note: connect-src needs https://cdn.jsdelivr.net for DuckDB CDN fetches.
    command === 'serve' && {
      name: 'strip-csp-dev',
      transformIndexHtml(html: string) {
        return html.replace(
          /<meta http-equiv="Content-Security-Policy"[^>]*>/,
          '<!-- CSP stripped in dev mode -->'
        );
      },
    },
  ].filter(Boolean),
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm']
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'duckdb': ['@duckdb/duckdb-wasm'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
}))
