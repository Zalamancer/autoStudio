import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const isElectron = process.env.ELECTRON === 'true'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
    include: ['mp4-muxer', 'webm-muxer', 'html2canvas'],
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
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-lottie': ['lottie-web'],
          'vendor-state': ['zustand', 'immer', 'zundo'],
          'vendor-gsap': ['gsap', '@gsap/react'],
        },
      },
    },
  },
})
