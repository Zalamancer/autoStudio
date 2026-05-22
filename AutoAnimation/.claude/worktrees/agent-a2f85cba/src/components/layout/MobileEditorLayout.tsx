import { useRef, useState, useCallback, useLayoutEffect, useEffect } from 'react'
import { RightPanel } from './RightPanel'
import { VideoCanvas } from '@/components/canvas'
import { Timeline } from '@/components/timeline'
import { useEditorStore } from '@/stores'
import { BRViewport, BRTimeline } from '@bonerigging/editor'
import { RigEditor3DViewport } from '@/components/canvas/RigEditor3DViewport'
import { Rig3DTimeline } from '@/components/timeline/Rig3DTimeline'
import { MobileLeftPanel } from './MobileLeftPanel'
import { MobileMenuPage } from './MobileMenuPage'
import { MobilePageIndicator } from './MobilePageIndicator'
import { NB2MobileWizard } from '@/components/mobile/NB2MobileWizard'
import { useNB2Store } from '@/stores/useNB2Store'

/** Page indices: 0=Menu, 1=Tools, 2=Canvas, 3=Properties */
const CANVAS_PAGE = 2

export function MobileEditorLayout() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activePage, setActivePage] = useState(CANVAS_PAGE)

  const isRigEditor = useEditorStore((s) => s.leftPanelActiveTab === 'rig-editor')
  const isRigEditor3D = useEditorStore((s) => s.leftPanelActiveTab === 'rig-editor-3d')
  const activeCanvasOverlay = useEditorStore((s) => s.activeCanvasOverlay)

  // Scroll to canvas page on mount (no animation)
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollLeft = el.clientWidth * CANVAS_PAGE
    }
  }, [])

  // Track active page via scroll position
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let rafId: number
    const handleScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const page = Math.round(el.scrollLeft / el.clientWidth)
        setActivePage(page)
      })
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const scrollToPage = useCallback((pageIndex: number) => {
    const el = scrollRef.current
    if (el) {
      el.scrollTo({ left: pageIndex * el.clientWidth, behavior: 'smooth' })
    }
  }, [])

  // Show mobile wizard when AI character generator overlay is active
  if (activeCanvasOverlay === 'character-generator') {
    return (
      <NB2MobileWizard
        onClose={() => {
          useNB2Store.getState().reset()
          useEditorStore.getState().closeCanvasOverlay()
        }}
      />
    )
  }

  return (
    <div
      className="w-screen flex flex-col bg-zinc-950 overflow-hidden text-zinc-100 font-sans"
      style={{ height: '100dvh' }}
    >
      {/* 4-page horizontal scroll-snap container */}
      <div
        ref={scrollRef}
        className="flex-1 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Page 0: Menu (replaces TopMenuBar on mobile) */}
        <section className="min-w-full w-full h-full snap-start snap-always shrink-0 overflow-y-auto">
          <MobileMenuPage />
        </section>

        {/* Page 1: Tools / Left Panel */}
        <section className="min-w-full w-full h-full snap-start snap-always shrink-0 overflow-y-auto">
          <MobileLeftPanel />
        </section>

        {/* Page 2: Canvas + Timeline */}
        <section className="min-w-full w-full h-full snap-start snap-always shrink-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            {isRigEditor ? (
              <BRViewport />
            ) : isRigEditor3D ? (
              <RigEditor3DViewport />
            ) : (
              <VideoCanvas />
            )}
          </div>
          <div className="shrink-0 overflow-hidden">
            {isRigEditor ? (
              <BRTimeline />
            ) : isRigEditor3D ? (
              <Rig3DTimeline />
            ) : (
              <Timeline />
            )}
          </div>
        </section>

        {/* Page 3: Properties / Right Panel */}
        <section className="min-w-full w-full h-full snap-start snap-always shrink-0 overflow-y-auto">
          <RightPanel />
        </section>
      </div>

      <MobilePageIndicator activePage={activePage} onPageSelect={scrollToPage} />
    </div>
  )
}
