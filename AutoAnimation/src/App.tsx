import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { EditorLayout } from '@/components/layout'
const ImageConfigPanel = lazy(() =>
  import('@/components/panels/ImageConfigPanel').then((m) => ({ default: m.ImageConfigPanel })),
)
import { AuthGuard } from '@/components/auth/AuthGuard'
import { LoginPage } from '@/components/auth/LoginPage'
import { ErrorBoundary } from '@/components/ErrorBoundary'
// Lazy-load modals (only loaded when user opens them)
const LibraryModal = lazy(() => import('@/components/modals/LibraryModal').then((m) => ({ default: m.LibraryModal })))
const ProjectsModal = lazy(() =>
  import('@/components/modals/ProjectsModal').then((m) => ({ default: m.ProjectsModal })),
)
const SettingsModal = lazy(() =>
  import('@/components/modals/SettingsModal').then((m) => ({ default: m.SettingsModal })),
)
const ExportModal = lazy(() => import('@/components/modals/ExportModal').then((m) => ({ default: m.ExportModal })))
const RecordingsModal = lazy(() =>
  import('@/components/modals/RecordingsModal').then((m) => ({ default: m.RecordingsModal })),
)
const ShareModal = lazy(() => import('@/components/modals/ShareModal').then((m) => ({ default: m.ShareModal })))
const AnalyticsModal = lazy(() =>
  import('@/components/modals/AnalyticsModal').then((m) => ({ default: m.AnalyticsModal })),
)
const InsightsPanel = lazy(() =>
  import('@/components/panels/InsightsPanel').then((m) => ({ default: m.InsightsPanel })),
)
const RecommendationsPanel = lazy(() =>
  import('@/components/panels/RecommendationsPanel').then((m) => ({ default: m.RecommendationsPanel })),
)
import { useEditorStore } from '@/stores'
import { useAuthStore } from '@/stores/useAuthStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useProjectStore } from '@/stores/useProjectStore'
// Lazy-load dashboard (code-split from editor)
const DashboardPage = lazy(() =>
  import('@/components/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useThemeEffect } from '@/hooks/useThemeEffect'
// Lazy-load builtin template seeding (60KB of data)
const seedBuiltinTemplatesAsync = () => import('@/data/builtinTemplates').then((m) => m.seedBuiltinTemplates())
import type { ClipPlan, OrchestratorSettings } from '@/types/orchestrator'
// Orchestrator store + service are lazy-loaded to keep them out of the main chunk.
// They are only needed when navigating from Dashboard with a clip plan.
const getOrchestratorStore = () => import('@/stores/useOrchestratorStore').then((m) => m.useOrchestratorStore)
const getBuildStepsFromPlan = () => import('@/services/orchestrator').then((m) => m.buildStepsFromPlan)
const UpgradeModal = lazy(() => import('@/components/credits/UpgradeModal').then((m) => ({ default: m.UpgradeModal })))
const SignInModal = lazy(() => import('@/components/modals/SignInModal').then((m) => ({ default: m.SignInModal })))
const TemplateDevMode = lazy(() =>
  import('@/components/panels/TemplateDevMode').then((m) => ({ default: m.TemplateDevMode })),
)
const TemplateRaterOverlay = lazy(() =>
  import('@/components/overlays/TemplateRaterOverlay').then((m) => ({ default: m.TemplateRaterOverlay })),
)
// Lazy-load billing page (code-split from editor)
const BillingPage = lazy(() => import('@/components/credits/BillingPage').then((m) => ({ default: m.BillingPage })))
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

// Lazy-load the bonerigging editor page (code-split, only loaded when navigating to /rig)
const RigEditorPage = lazy(() => import('@/components/pages/RigEditorPage'))

// LandingPage removed — replaced by GatePage (white sign-in page)

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

// Seed built-in HTML templates lazily (non-blocking)
seedBuiltinTemplatesAsync()

/** Gate page — sign in with email/password or Google, shown to unauthenticated visitors */
function GatePage() {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) return <div className="min-h-screen bg-zinc-900" />
  if (user) return <Navigate to="/editor" replace />

  return <LoginPage />
}

/** Route guard — redirects to gate if not authenticated */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-white" />
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

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
  // Orchestrator modules are dynamically imported to avoid pulling them into the main chunk.
  useEffect(() => {
    const state = location.state as {
      clipPlan?: ClipPlan
      clipPrompt?: string
      clipSettings?: OrchestratorSettings
      autoGenerate?: boolean
    } | null

    if (state?.clipPlan) {
      const plan = state.clipPlan
      Promise.all([getOrchestratorStore(), getBuildStepsFromPlan()]).then(([orchStore, buildSteps]) => {
        orchStore.setState({
          prompt: state.clipPrompt || '',
          plan,
          steps: buildSteps(plan, state.clipSettings || orchStore.getState().settings),
          phase: 'reviewing',
          settings: state.clipSettings || orchStore.getState().settings,
          error: null,
          isRunning: false,
        })
      })

      // Clear location state so refresh doesn't re-trigger
      window.history.replaceState({}, '', '/editor')
    } else if (state?.clipPrompt) {
      // Set prompt and open AI Director (used by Brand Intel + first-run welcome)
      getOrchestratorStore().then((orchStore) => {
        orchStore.setState({
          prompt: state.clipPrompt!,
          phase: 'idle',
          error: null,
          isRunning: false,
        })
        useEditorStore.getState().setLeftPanelActiveTab('ai-director')

        // Auto-trigger plan generation for first-run welcome flow
        if (state.autoGenerate) {
          requestAnimationFrame(() => {
            orchStore.getState().generatePlan()
          })
        }
      })

      window.history.replaceState({}, '', '/editor')
    }
  }, [location.state])

  return (
    <>
      <EditorLayout />
      <Suspense
        fallback={
          <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50">
            <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full" />
          </div>
        }
      >
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
      </Suspense>
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <ConfirmDialog />
        <Routes>
          <Route path="/" element={<GatePage />} />
          <Route
            path="/editor"
            element={
              <RequireAuth>
                <EditorApp />
              </RequireAuth>
            }
          />
          <Route path="/landing" element={<Navigate to="/" replace />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Suspense
                  fallback={<div className="flex items-center justify-center h-screen bg-gray-950 text-white" />}
                >
                  <DashboardPage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/billing"
            element={
              <RequireAuth>
                <Suspense
                  fallback={<div className="flex items-center justify-center h-screen bg-gray-950 text-white" />}
                >
                  <BillingPage />
                </Suspense>
              </RequireAuth>
            }
          />
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
              <RequireAuth>
                <Suspense
                  fallback={<div className="flex items-center justify-center h-screen bg-gray-950 text-white" />}
                >
                  <BrandIntelPage />
                </Suspense>
              </RequireAuth>
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
              <RequireAuth>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
                      Loading gallery...
                    </div>
                  }
                >
                  <DevTemplateGallery />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/rig/:rigId?"
            element={
              <RequireAuth>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
                      Loading rig editor...
                    </div>
                  }
                >
                  <RigEditorPage />
                </Suspense>
              </RequireAuth>
            }
          />
        </Routes>
      </AuthGuard>
    </ErrorBoundary>
  )
}

export default App
