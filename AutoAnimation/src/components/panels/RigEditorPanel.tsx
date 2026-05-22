/**
 * Unified Rig Editor Panel — replaces separate 2D/3D rig editor wrappers.
 * Header with back button + dropdown selector (2D/3D Rig Editor).
 * Two tabs: RIG and ANIMATION.
 */
import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, Bone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/stores'
import { BRToolPanel } from '@bonerigging/editor'
import { BoneHierarchyTree } from './BoneHierarchyTree'
import { CharacterSelector3D } from './RigEditor3DPanel'
import { use3DRigStore } from '@/stores/use3DRigStore'

const RigEditorAnimationTab = lazy(() => import('./RigEditorAnimationTab'))

type RigMode = '2d' | '3d'
type EditorTab = 'rig' | 'animation'

export function RigEditorPanel() {
  const leftPanelActiveTab = useEditorStore((s) => s.leftPanelActiveTab)
  const setLeftPanelActiveTab = useEditorStore((s) => s.setLeftPanelActiveTab)

  const [mode, setMode] = useState<RigMode>(leftPanelActiveTab === 'rig-editor-3d' ? '3d' : '2d')
  const [tab, setTab] = useState<EditorTab>('rig')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  // 3D rig state for bone hierarchy
  const activeRig = use3DRigStore((s) => s.getActiveRig())
  const selectedBoneName = use3DRigStore((s) => s.selectedBoneName)
  const hoveredBoneName = use3DRigStore((s) => s.hoveredBoneName)
  const selectBone = use3DRigStore((s) => s.selectBone)
  const hoverBone = use3DRigStore((s) => s.hoverBone)

  const handleModeSwitch = (newMode: RigMode) => {
    setMode(newMode)
    setDropdownOpen(false)
    // Sync canvas context
    setLeftPanelActiveTab(newMode === '2d' ? 'rig-editor' : 'rig-editor-3d')
  }

  const handleBack = () => {
    setLeftPanelActiveTab(mode === '2d' ? 'character' : '3d-objects')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header: < Dropdown > + tabs */}
      <div className="shrink-0 border-b border-white/5">
        <div className="flex items-center gap-1 px-3 py-2">
          <button
            onClick={handleBack}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
            title="Back to editor"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={() => handleModeSwitch(mode === '2d' ? '3d' : '2d')}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
            title="Previous"
          >
            <ChevronLeft size={16} />
          </button>

          <div ref={dropdownRef} className="relative flex-1 min-w-0">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <Bone size={14} className="shrink-0 text-accent" />
              <span className="truncate">{mode === '2d' ? '2D' : '3D'} Rig Editor</span>
              <ChevronDown
                size={14}
                className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-panel-bg border border-white/5 rounded-xl shadow-2xl py-1.5">
                {(['2d', '3d'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleModeSwitch(m)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                      mode === m
                        ? 'bg-accent/10 text-accent'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]',
                    )}
                  >
                    <Bone size={15} className="shrink-0" />
                    <span className="truncate">{m === '2d' ? '2D' : '3D'} Rig Editor</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => handleModeSwitch(mode === '2d' ? '3d' : '2d')}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
            title="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-3 gap-1 pb-1">
          {(['rig', 'animation'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 h-7 rounded-md text-xs font-medium transition-colors',
                tab === t ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50',
              )}
            >
              {t === 'rig' ? 'RIG' : 'ANIMATION'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {tab === 'rig' ? (
          mode === '2d' ? (
            <BRToolPanel />
          ) : !activeRig ? (
            <div className="overflow-y-auto flex-1">
              <CharacterSelector3D />
            </div>
          ) : (
            <div className="p-3 overflow-y-auto flex-1">
              <BoneHierarchyTree
                skeletonTree={activeRig.skeletonTree}
                selectedBoneName={selectedBoneName}
                hoveredBoneName={hoveredBoneName}
                onSelectBone={selectBone}
                onHoverBone={hoverBone}
              />
            </div>
          )
        ) : (
          <Suspense fallback={null}>
            <RigEditorAnimationTab mode={mode} />
          </Suspense>
        )}
      </div>
    </div>
  )
}
