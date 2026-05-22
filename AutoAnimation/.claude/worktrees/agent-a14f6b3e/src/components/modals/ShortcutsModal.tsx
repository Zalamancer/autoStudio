import { useEditorStore } from '@/stores'
import { X } from 'lucide-react'

interface ShortcutEntry {
  keys: string
  description: string
}

interface ShortcutGroup {
  title: string
  shortcuts: ShortcutEntry[]
}

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
const mod = isMac ? '\u2318' : 'Ctrl'

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Playback',
    shortcuts: [
      { keys: 'Space', description: 'Play / Pause' },
      { keys: '\u2190', description: 'Step backward 1 frame' },
      { keys: '\u2192', description: 'Step forward 1 frame' },
      { keys: 'Shift+\u2190', description: 'Step backward 10 frames' },
      { keys: 'Shift+\u2192', description: 'Step forward 10 frames' },
      { keys: 'Home', description: 'Go to first frame' },
      { keys: 'End', description: 'Go to last frame' },
    ],
  },
  {
    title: 'Editing',
    shortcuts: [
      { keys: `${mod}+Z`, description: 'Undo' },
      { keys: `${mod}+Shift+Z`, description: 'Redo' },
      { keys: `${mod}+S`, description: 'Save project' },
      { keys: 'K', description: 'Toggle keyframe record mode' },
      { keys: 'Delete', description: 'Delete selected item' },
      { keys: 'Escape', description: 'Clear selection' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: `${mod}+=`, description: 'Zoom in timeline' },
      { keys: `${mod}+-`, description: 'Zoom out timeline' },
      { keys: `${mod}+0`, description: 'Fit canvas to view' },
      { keys: '3', description: 'Toggle 3D layer view' },
      { keys: `${mod}+/`, description: 'Show keyboard shortcuts' },
    ],
  },
]

export function ShortcutsModal() {
  const open = useEditorStore((s) => s.shortcutsModalOpen)
  const setOpen = useEditorStore((s) => s.setShortcutsModalOpen)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-100">Keyboard Shortcuts</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((s) => (
                  <div
                    key={s.keys}
                    className="flex items-center justify-between py-1.5 text-sm"
                  >
                    <span className="text-zinc-300">{s.description}</span>
                    <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
