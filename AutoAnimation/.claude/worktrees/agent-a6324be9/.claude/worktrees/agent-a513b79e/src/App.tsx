import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { EditorLayout } from '@/components/layout'
import { ImageConfigPanel } from '@/components/panels'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LibraryModal } from '@/components/modals/LibraryModal'
import { ProjectsModal } from '@/components/modals/ProjectsModal'
import { SettingsModal } from '@/components/modals/SettingsModal'
import { ExportModal } from '@/components/modals/ExportModal'
import { RecordingsModal } from '@/components/modals/RecordingsModal'
import { ShareModal } from '@/components/modals/ShareModal'
import { AnalyticsModal } from '@/components/modals/AnalyticsModal'
import { InsightsPanel } from '@/components/panels/InsightsPanel'
import { RecommendationsPanel } from '@/components/panels/RecommendationsPanel'
import { useEditorStore } from '@/stores'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useThemeEffect } from '@/hooks/useThemeEffect'
import { seedBuiltinTemplates } from '@/data/builtinTemplates'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import { buildStepsFromPlan } from '@/services/orchestrator'
import type { ClipPlan, OrchestratorSettings } from '@/types/orchestrator'
import { UpgradeModal } from '@/components/credits/UpgradeModal'
import { SignInModal } from '@/components/modals/SignInModal'
import { TemplateDevMode } from '@/components/panels/TemplateDevMode'
import { TemplateRaterOverlay } from '@/components/overlays/TemplateRaterOverlay'
import { BillingPage } from '@/components/credits/BillingPage'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

// Lazy-load the bonerigging editor page (code-split, only loaded when navigating to /rig)
const RigEditorPage = lazy(() => import('@/components/pages/RigEditorPage'))

// Lazy-load the landing page (code-split from editor)
const LandingPage = lazy(() => import('@/components/landing/LandingPage'))

// Lazy-load the brand intelligence page
const BrandIntelPage = lazy(() => import('@/components/pages/BrandIntelPage'))

// Lazy-load legal pages
const TermsOfService = lazy(() => import('@/components/landing/TermsOfService'))
const PrivacyPolicy = lazy(() => import('@/components/landing/PrivacyPolicy'))

// Lazy-load reset password page
const ResetPasswordPage = lazy(() =>
  import('@/components/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)

// Lazy-load portfolio page
const PortfolioPage = lazy(() => import('@/components/pages/PortfolioPage'))

// Dev template gallery (dev mode only)
const DevTemplateGallery = lazy(() =>
  import('@/components/pages/DevTemplateGallery').then((m) => ({ default: m.DevTemplateGallery })),
)

// Seed built-in HTML templates into the library on first load
seedBuiltinTemplates()

/** Editor route — existing app with incoming plan detection */
function EditorApp() {
  useKeyboardShortcuts()
  useThemeEffect()
  const location = useLocation()

  // Restore persisted voices from IndexedDB on mount
  useEffect(() => {
    useVoiceStore.getState().fetchClonedVoices()
  }, [])

  // Restore local project from localStorage (when Supabase is not configured)
  useEffect(() => {
    useProjectStore.getState().loadLocalProject()
  }, [])

  // Disable native right-click context menu globally (canvas has its own)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Allow right-click on form inputs for text editing
      const target = e.target as HTMLElement
      const tag = target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return
      e.preventDefault()
    }
    document.addEventListener('contextmenu', handler)
    return () => document.removeEventListener('contextmenu', handler)
  }, [])
  const insightsOpen = useEditorStore((s) => s.insightsModalOpen)
  const recommendationsOpen = useEditorStore((s) => s.recommendationsModalOpen)

  // Detect incoming plan from Dashboard "Open in Editor"
  useEffect(() => {
    const state = location.state as {
      clipPlan?: ClipPlan
      clipPrompt?: string
      clipSettings?: OrchestratorSettings
    } | null

    if (state?.clipPlan) {
      const plan = state.clipPlan
      useOrchestratorStore.setState({
        prompt: state.clipPrompt || '',
        plan,
        steps: buildStepsFromPlan(plan, state.clipSettings || useOrchestratorStore.getState().settings),
        phase: 'reviewing',
        settings: state.clipSettings || useOrchestratorStore.getState().settings,
        error: null,
        isRunning: false,
      })

      // Clear location state so refresh doesn't re-trigger
      window.history.replaceState({}, '', '/editor')
    } else if (state?.clipPrompt) {
      // Brand Intel "Use in Orchestrator" — set prompt and open AI Director
      useOrchestratorStore.setState({
        prompt: state.clipPrompt,
        phase: 'idle',
        error: null,
        isRunning: false,
      })
      useEditorStore.getState().openCanvasOverlay('ai-director')

      window.history.replaceState({}, '', '/editor')
    }
  }, [location.state])

  return (
    <>
      <EditorLayout />
      <ImageConfigPanel />
      <LibraryModal />
      <ProjectsModal />
      <SettingsModal />
      <ExportModal />
      <RecordingsModal />
      <ShareModal />
      <AnalyticsModal />
      {insightsOpen && <InsightsPanel />}
      {recommendationsOpen && <RecommendationsPanel />}
      <UpgradeModal />
      <SignInModal />
      <TemplateDevMode />
      <TemplateRaterOverlay />
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <ConfirmDialog />
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-950 text-white" />}>
                <LandingPage />
              </Suspense>
            }
          />
          <Route path="/editor" element={<EditorApp />} />
          <Route path="/landing" element={<Navigate to="/" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route
            path="/portfolio/:username"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-950 text-white" />}>
                <PortfolioPage />
              </Suspense>
            }
          />
          <Route
            path="/brand"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-950 text-white" />}>
                <BrandIntelPage />
              </Suspense>
            }
          />
          <Route
            path="/reset-password"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-950 text-white" />}>
                <ResetPasswordPage />
              </Suspense>
            }
          />
          <Route
            path="/terms"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-950 text-white" />}>
                <TermsOfService />
              </Suspense>
            }
          />
          <Route
            path="/privacy"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-950 text-white" />}>
                <PrivacyPolicy />
              </Suspense>
            }
          />
          <Route
            path="/dev/gallery"
            element={
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
                    Loading gallery...
                  </div>
                }
              >
                <DevTemplateGallery />
              </Suspense>
            }
          />
          <Route
            path="/rig/:rigId?"
            element={
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
                    Loading rig editor...
                  </div>
                }
              >
                <RigEditorPage />
              </Suspense>
            }
          />
        </Routes>
      </AuthGuard>
    </ErrorBoundary>
  )
}

export default App
