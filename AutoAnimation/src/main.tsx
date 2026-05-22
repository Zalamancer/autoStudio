import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    enabled: import.meta.env.PROD,
  })
}

// Global crash handlers — show visible errors when devtools can't be opened
window.addEventListener('unhandledrejection', (e) => {
  console.error('[UNHANDLED REJECTION]', e.reason)
  const msg = e.reason instanceof Error ? e.reason.message : String(e.reason)
  document.title = `⚠ ${msg.slice(0, 60)}`
})

window.addEventListener('error', (e) => {
  console.error('[UNCAUGHT ERROR]', e.error || e.message)
  const msg = e.error?.message || e.message || 'Unknown error'
  document.title = `⚠ ${msg.slice(0, 60)}`
})

const isElectron = !!(window as any).electronAPI
const Router = isElectron ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
)

// Register service worker for asset caching (cache-first for hashed chunks)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[SW] Registration failed:', err)
    })
  })
}
// Deploy trigger 1770972569
