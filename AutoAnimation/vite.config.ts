import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

const isElectron = process.env.ELECTRON === 'true'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ...(process.env.ANALYZE === 'true'
      ? [
          visualizer({
            filename: 'reports/bundle-stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
  // Use relative paths in Electron so file:// protocol works
  base: isElectron ? './' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@bonerigging/core': path.resolve(__dirname, './src/bonerigging/core/src/index.ts'),
      '@bonerigging/editor': path.resolve(__dirname, './src/bonerigging/editor/src/index.ts'),
    },
  },
  optimizeDeps: {
    include: ['mp4-muxer', 'webm-muxer'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      external: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
      output: {
        manualChunks(id) {
          // ── Vendor chunks (npm dependencies) ──
          if (id.includes('node_modules')) {
            // Explicit vendor groups
            if (id.includes('/react-dom/')) return 'vendor-react'
            if (id.includes('/react/')) return 'vendor-react'
            if (id.includes('/react-router-dom/') || id.includes('/@remix-run/') || id.includes('/react-router/'))
              return 'vendor-router'
            if (id.includes('/@supabase/')) return 'vendor-supabase'
            if (id.includes('/lottie-web/')) return 'vendor-lottie'
            if (id.includes('/zustand/') || id.includes('/immer/') || id.includes('/zundo/')) return 'vendor-state'
            if (id.includes('/gsap/') || id.includes('/@gsap/')) return 'vendor-gsap'
            if (
              id.includes('/three/') ||
              id.includes('/@react-three/') ||
              id.includes('/three-stdlib/') ||
              id.includes('/maath/')
            )
              return 'vendor-three'
            if (id.includes('/pixi.js/') || id.includes('/@pixi/')) return 'vendor-pixi'
            if (id.includes('/slate/') || id.includes('/slate-react/') || id.includes('/slate-history/'))
              return 'vendor-slate'
            if (id.includes('/pdfjs-dist/')) return 'vendor-pdf'
            if (id.includes('/xlsx/')) return 'vendor-xlsx'
            if (id.includes('/@sentry/')) return 'vendor-sentry'
            if (
              id.includes('/react-moveable/') ||
              id.includes('/@daybrush/') ||
              id.includes('/css-to-mat/') ||
              id.includes('/overlap-area/') ||
              id.includes('/gesto/') ||
              id.includes('/framework-utils/')
            )
              return 'vendor-moveable'
            if (id.includes('/@imgly/background-removal')) return 'vendor-bg-removal'
            if (id.includes('/html2canvas/')) return 'vendor-html2canvas'
            if (id.includes('/mp4-muxer/') || id.includes('/webm-muxer/')) return 'vendor-muxers'
            if (id.includes('/jszip/')) return 'vendor-jszip'
            if (id.includes('/opentype.js/')) return 'vendor-opentype'
            // Don't split lucide-react — it's tree-shaken and shared across many chunks
          }

          // ── Application code chunks ──

          // Bonerigging vendor (12K+ lines, only needed in rig editor mode)
          if (id.includes('/bonerigging/')) return 'app-bonerigging'

          // Canvas 2D renderer + composition engine (only needed for export/preview)
          if (id.includes('/services/canvas2dRenderer') || id.includes('/services/pixiExportRenderer'))
            return 'app-renderers'

          // Voice/lip-sync pipeline (only needed when using voice features)
          if (
            id.includes('/services/elevenlabs') ||
            id.includes('/services/lipSync') ||
            id.includes('/services/visemeMapper') ||
            id.includes('/services/captions') ||
            id.includes('/services/emotionTimeline')
          )
            return 'app-voice'
        },
      },
    },
  },
})
