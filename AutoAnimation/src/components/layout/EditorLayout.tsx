import { lazy, Suspense } from 'react'
import { PanelErrorBoundary } from '@/components/PanelErrorBoundary'
import { LeftPanel, LeftPanelToggle } from './LeftPanel'
import { RightPanel } from './RightPanel'
import { VideoCanvas } from '@/components/canvas'
import { Timeline } from '@/components/timeline'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { TopMenuBar } from './TopMenuBar'
import { useEditorStore } from '@/stores'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useSchemaRuntime } from '@/hooks/useSchemaRuntime'
import { MobileEditorLayout } from './MobileEditorLayout'
import { useNodeCanvasStore } from '@/stores/useNodeCanvasStore'
import { NodeEditorLayout } from '@/components/nodeCanvas/NodeEditorLayout'
import { MarketplaceView } from './MarketplaceView'
// Lazy-load bonerigging components (12K+ lines, only needed in rig-editor mode)
const BRViewport = lazy(() => import('@bonerigging/editor').then((m) => ({ default: m.BRViewport })))
const BRTimeline = lazy(() => import('@bonerigging/editor').then((m) => ({ default: m.BRTimeline })))
const RigEditorWrapper = lazy(() => import('./RigEditorWrapper').then((m) => ({ default: m.RigEditorWrapper })))
const RigEditor3DViewport = lazy(() =>
  import('@/components/canvas/RigEditor3DViewport').then((m) => ({ default: m.RigEditor3DViewport })),
)
const Rig3DTimeline = lazy(() =>
  import('@/components/timeline/Rig3DTimeline').then((m) => ({ default: m.Rig3DTimeline })),
)

export function EditorLayout() {
  useKeyboardShortcuts()
  useSchemaRuntime()
  const isMobile = useIsMobile()
  const isRigEditor = useEditorStore((s) => s.leftPanelActiveTab === 'rig-editor')
  const isRigEditor3D = useEditorStore((s) => s.leftPanelActiveTab === 'rig-editor-3d')
  const hasCanvasOverlay = useEditorStore((s) => s.activeCanvasOverlay != null)
  const isMarketplace = useEditorStore((s) => s.leftPanelActiveGroup === 'marketplace')
  const viewMode = useNodeCanvasStore((s) => s.viewMode)
  const useNodesView = viewMode === 'nodes' && !isMobile && !isRigEditor && !isRigEditor3D

  const layout = isMobile ? (
    <MobileEditorLayout />
  ) : (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 overflow-hidden text-zinc-100 font-sans p-1.5 gap-1.5">
      {/* Top menu bar (File, Settings) + save status */}
      <TopMenuBar />

      {/* Main Content Area */}
      {isMarketplace ? (
        <MarketplaceView />
      ) : useNodesView ? (
        <NodeEditorLayout />
      ) : (
        <div className="flex-1 relative min-h-0">
          <div className="h-full flex overflow-hidden gap-1.5">
            {/* Left Panel */}
            <LeftPanel />

            {/* Center - Canvas + Timeline stacked */}
            <div className="flex-1 flex flex-col overflow-hidden gap-1.5">
              {isRigEditor ? (
                <Suspense fallback={null}>
                  <PanelErrorBoundary panelName="Rig Viewport">
                    <BRViewport />
                  </PanelErrorBoundary>
                  <PanelErrorBoundary panelName="Rig Timeline">
                    <BRTimeline />
                  </PanelErrorBoundary>
                </Suspense>
              ) : isRigEditor3D ? (
                <Suspense fallback={null}>
                  <PanelErrorBoundary panelName="3D Rig Viewport">
                    <RigEditor3DViewport />
                  </PanelErrorBoundary>
                  <PanelErrorBoundary panelName="3D Rig Timeline">
                    <Rig3DTimeline />
                  </PanelErrorBoundary>
                </Suspense>
              ) : (
                <>
                  <PanelErrorBoundary panelName="Video Canvas">
                    <VideoCanvas />
                  </PanelErrorBoundary>
                  {!hasCanvasOverlay && (
                    <PanelErrorBoundary panelName="Timeline">
                      <Timeline />
                    </PanelErrorBoundary>
                  )}
                </>
              )}
            </div>

            {/* Right Panel */}
            <PanelErrorBoundary panelName="Right Panel">
              <RightPanel />
            </PanelErrorBoundary>
          </div>

          {/* Toggle pill — outside overflow-hidden, overlaps via absolute positioning */}
          <LeftPanelToggle />
        </div>
      )}
    </div>
  )

  if (isRigEditor) {
    return (
      <Suspense fallback={null}>
        <RigEditorWrapper>{layout}</RigEditorWrapper>
      </Suspense>
    )
  }

  return layout
}
