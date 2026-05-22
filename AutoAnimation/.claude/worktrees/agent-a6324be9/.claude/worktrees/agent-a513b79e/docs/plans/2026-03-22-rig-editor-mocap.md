# Rig Editor Restructure + Motion Capture Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the rig editor left panel into a unified panel with dropdown (2D/3D) + two tabs (RIG/ANIMATION), and add DeepMotion cloud API integration for premium-quality video-to-rig motion capture.

**Architecture:** Replace the separate `RigEditor2DWrapper` (inline in LeftPanel.tsx) and `RigEditor3DPanel` with a single `RigEditorPanel` component that has a 2D/3D dropdown selector and RIG/ANIMATION tab switcher. The ANIMATION tab consolidates existing AI Animation, Motion Tracking, and Motion Capture panels plus a new DeepMotion integration. DeepMotion API calls are proxied through Express to avoid CORS issues.

**Tech Stack:** React 19, TypeScript, Zustand, Three.js, Express, DeepMotion REST API

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/components/panels/RigEditorPanel.tsx` | Unified rig editor panel: dropdown + tabs + content routing |
| Create | `src/components/panels/RigEditorAnimationTab.tsx` | ANIMATION tab: AI animation + motion tracking + motion capture + DeepMotion |
| Create | `src/components/panels/DeepMotionPanel.tsx` | DeepMotion upload + poll + download UI |
| Create | `src/services/deepMotionClient.ts` | Client-side API calls to our Express proxy |
| Create | `src/stores/useDeepMotionStore.ts` | DeepMotion job state (upload, polling, result) |
| Create | `server/routes/deepmotion.ts` | Express proxy routes for DeepMotion REST API |
| Modify | `src/components/layout/LeftPanel/LeftPanel.tsx:540-602,758-759` | Remove `RigEditor2DWrapper`, wire up `RigEditorPanel` |
| Modify | `server/index.ts:~155` | Mount deepmotion routes |

---

### Task 1: Create Unified RigEditorPanel

**Files:**
- Create: `src/components/panels/RigEditorPanel.tsx`
- Modify: `src/components/layout/LeftPanel/LeftPanel.tsx:540-602,758-759`

- [ ] **Step 1: Create RigEditorPanel component**

Create `src/components/panels/RigEditorPanel.tsx`:

```tsx
/**
 * Unified Rig Editor Panel — replaces separate 2D/3D rig editor wrappers.
 * Header: back button + dropdown (2D/3D) selector
 * Body: two tabs — RIG (editing tools) and ANIMATION (generation + mocap)
 */
import { useState, lazy, Suspense } from 'react'
import { ArrowLeft, Bone, ChevronDown } from 'lucide-react'
import { useEditorStore } from '@/stores'
import { cn } from '@/lib/utils'

// 2D rig tools (embedded bonerigging tool panel)
import { BRToolPanel } from '@bonerigging/editor'
// 3D rig tools
import { BoneHierarchyTree } from './BoneHierarchyTree'
import { use3DRigStore } from '@/stores/use3DRigStore'

const RigEditorAnimationTab = lazy(() => import('./RigEditorAnimationTab'))
const CharacterSelector3D = lazy(() => import('./RigEditor3DPanel').then(m => ({ default: m.CharacterSelector3D })))

type RigMode = '2d' | '3d'
type RigTab = 'rig' | 'animation'

export function RigEditorPanel() {
  const leftPanelActiveTab = useEditorStore((s) => s.leftPanelActiveTab)
  const setLeftPanelActiveTab = useEditorStore((s) => s.setLeftPanelActiveTab)

  // Derive initial mode from which tab opened this
  const [mode, setMode] = useState<RigMode>(leftPanelActiveTab === 'rig-editor-3d' ? '3d' : '2d')
  const [activeTab, setActiveTab] = useState<RigTab>('rig')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleModeChange = (newMode: RigMode) => {
    setMode(newMode)
    setDropdownOpen(false)
    // Sync the left panel tab so EditorLayout swaps canvas correctly
    setLeftPanelActiveTab(newMode === '2d' ? 'rig-editor' : 'rig-editor-3d')
  }

  const handleBack = () => {
    setLeftPanelActiveTab(mode === '2d' ? 'character' : '3d-objects')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header: back + dropdown + mode selector */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <button
          onClick={handleBack}
          className="p-1 rounded hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft size={14} />
        </button>
        <Bone size={14} className="text-green-400" />

        {/* Dropdown: 2D / 3D selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            {mode === '2d' ? '2D Rig Editor' : '3D Rig Editor'}
            <ChevronDown size={12} className={cn('transition-transform', dropdownOpen && 'rotate-180')} />
          </button>
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 bg-zinc-800 border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[160px]">
                <button
                  onClick={() => handleModeChange('2d')}
                  className={cn(
                    'w-full px-3 py-2 text-left text-xs transition-colors',
                    mode === '2d' ? 'bg-blue-500/20 text-blue-300' : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'
                  )}
                >
                  2D Rig Editor
                </button>
                <button
                  onClick={() => handleModeChange('3d')}
                  className={cn(
                    'w-full px-3 py-2 text-left text-xs transition-colors',
                    mode === '3d' ? 'bg-blue-500/20 text-blue-300' : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'
                  )}
                >
                  3D Rig Editor
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tab bar: RIG / ANIMATION */}
      <div className="shrink-0 flex border-b border-white/5">
        {(['rig', 'animation'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 text-xs font-medium uppercase tracking-wider transition-colors border-b-2',
              activeTab === tab
                ? 'text-blue-400 border-blue-400'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {activeTab === 'rig' ? (
          <RigTabContent mode={mode} />
        ) : (
          <Suspense fallback={null}>
            <RigEditorAnimationTab mode={mode} />
          </Suspense>
        )}
      </div>
    </div>
  )
}

/** RIG tab: 2D shows BRToolPanel, 3D shows bone hierarchy or character selector */
function RigTabContent({ mode }: { mode: RigMode }) {
  const activeRig3D = use3DRigStore((s) => s.getActiveRig())
  const selectedBoneName = use3DRigStore((s) => s.selectedBoneName)
  const hoveredBoneName = use3DRigStore((s) => s.hoveredBoneName)
  const selectBone = use3DRigStore((s) => s.selectBone)
  const hoverBone = use3DRigStore((s) => s.hoverBone)

  if (mode === '2d') {
    return <BRToolPanel />
  }

  // 3D mode
  if (!activeRig3D) {
    return (
      <Suspense fallback={null}>
        <CharacterSelector3D />
      </Suspense>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <BoneHierarchyTree
        skeletonTree={activeRig3D.skeletonTree}
        selectedBoneName={selectedBoneName}
        hoveredBoneName={hoveredBoneName}
        onSelectBone={selectBone}
        onHoverBone={hoverBone}
      />
    </div>
  )
}
```

- [ ] **Step 2: Export CharacterSelector from RigEditor3DPanel**

In `src/components/panels/RigEditor3DPanel.tsx`, the `CharacterSelector` function component is currently not exported. Add a named export so `RigEditorPanel` can lazy-load it:

Add at the bottom of `RigEditor3DPanel.tsx`:
```tsx
export { CharacterSelector as CharacterSelector3D }
```

- [ ] **Step 3: Replace wrappers in LeftPanel.tsx**

In `src/components/layout/LeftPanel/LeftPanel.tsx`:

1. Delete the entire `RigEditor2DWrapper` function (lines 540-602)
2. Add import at top: `import { RigEditorPanel } from '@/components/panels/RigEditorPanel'`
3. Replace lines 758-759:
   ```tsx
   // OLD:
   if (tab === 'rig-editor') return <RigEditor2DWrapper />
   if (tab === 'rig-editor-3d') return <RigEditor3DPanel />
   // NEW:
   if (tab === 'rig-editor' || tab === 'rig-editor-3d') return <RigEditorPanel />
   ```
4. Remove `RigEditor3DPanel` import (it's no longer directly used by LeftPanel)

- [ ] **Step 4: Verify rig editor opens and tabs switch**

Run `npm run dev`, open editor, click into a 2D character → "Edit Rig". Verify:
- Dropdown shows "2D Rig Editor"
- RIG/ANIMATION tabs visible
- RIG tab shows BRToolPanel
- Switching dropdown to "3D Rig Editor" changes canvas context
- Back button returns to character panel

- [ ] **Step 5: Commit**

```
feat(rig-editor): unified panel with 2D/3D dropdown + RIG/ANIMATION tabs
```

---

### Task 2: Create Animation Tab

**Files:**
- Create: `src/components/panels/RigEditorAnimationTab.tsx`

- [ ] **Step 1: Create RigEditorAnimationTab**

```tsx
/**
 * ANIMATION tab for the rig editor.
 * Sections: AI Animation (2D), Motion Tracking (2D webcam), Motion Capture (video), DeepMotion (cloud API)
 */
import { useState, lazy, Suspense } from 'react'
import { Wand2, Camera, Video, Cloud, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Existing panels
import { RigAnimationGeneratorPanel } from './RigAnimationGeneratorPanel'
import { MotionTrackingPanel } from './MotionTrackingPanel'
import { MotionCapturePanel } from './MotionCapturePanel'

const DeepMotionPanel = lazy(() => import('./DeepMotionPanel'))
const LiveAvatarPanel = lazy(() => import('./LiveAvatarPanel').then(m => ({ default: m.LiveAvatarPanel })))

interface Props {
  mode: '2d' | '3d'
}

interface SectionProps {
  icon: React.ElementType
  label: string
  badge?: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({ icon: Icon, label, badge, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Icon size={12} />
        <span className="font-medium">{label}</span>
        {badge && (
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div className="max-h-[400px] overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  )
}

export default function RigEditorAnimationTab({ mode }: Props) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* AI Animation — 2D only (uses bonerigging engine) */}
      {mode === '2d' && (
        <CollapsibleSection icon={Wand2} label="AI Animation">
          <RigAnimationGeneratorPanel />
        </CollapsibleSection>
      )}

      {/* Motion Tracking — webcam live performance */}
      <CollapsibleSection icon={Camera} label={mode === '2d' ? 'Perform (Webcam)' : 'Live Avatar'}>
        {mode === '2d' ? (
          <MotionTrackingPanel />
        ) : (
          <Suspense fallback={null}><LiveAvatarPanel /></Suspense>
        )}
      </CollapsibleSection>

      {/* Motion Capture — video file upload, client-side MediaPipe */}
      <CollapsibleSection icon={Video} label="Motion Capture (Video)">
        <MotionCapturePanel />
      </CollapsibleSection>

      {/* DeepMotion — cloud API, premium quality */}
      <CollapsibleSection icon={Cloud} label="DeepMotion" badge="PRO">
        <Suspense fallback={null}>
          <DeepMotionPanel mode={mode} />
        </Suspense>
      </CollapsibleSection>
    </div>
  )
}
```

- [ ] **Step 2: Verify animation tab renders all sections**

Run dev, open rig editor, click ANIMATION tab. Verify all 4 sections appear as collapsible accordions.

- [ ] **Step 3: Commit**

```
feat(rig-editor): animation tab with AI, webcam, video mocap, DeepMotion sections
```

---

### Task 3: DeepMotion Express Proxy Routes

**Files:**
- Create: `server/routes/deepmotion.ts`
- Modify: `server/index.ts`

- [ ] **Step 1: Create server/routes/deepmotion.ts**

```typescript
/**
 * DeepMotion API proxy routes.
 *
 * Proxies requests to DeepMotion Animate 3D REST API to avoid CORS.
 * API docs: https://github.com/DeepMotion/Animate-3D-REST-API
 *
 * Flow: authenticate → get upload URL → upload video → process → poll status → download
 *
 * Env vars: DEEPMOTION_CLIENT_ID, DEEPMOTION_CLIENT_SECRET
 */
import { Router } from 'express'

const router = Router()

const DM_BASE = 'https://service.deepmotion.com'

/** Get a session cookie from DeepMotion */
async function authenticate(): Promise<string> {
  const clientId = process.env.DEEPMOTION_CLIENT_ID
  const clientSecret = process.env.DEEPMOTION_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('DeepMotion credentials not configured')

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch(`${DM_BASE}/session/auth`, {
    headers: { Authorization: `Basic ${credentials}` },
  })
  if (!res.ok) throw new Error(`DeepMotion auth failed: ${res.status}`)

  // Extract session cookie
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) throw new Error('No session cookie returned')
  return setCookie.split(';')[0]
}

/** POST /api/deepmotion/process — upload video + start processing */
router.post('/process', async (req, res) => {
  try {
    const cookie = await authenticate()

    // 1. Get upload URL
    const uploadRes = await fetch(`${DM_BASE}/upload`, {
      headers: { Cookie: cookie },
    })
    if (!uploadRes.ok) throw new Error(`Upload URL failed: ${uploadRes.status}`)
    const { url: uploadUrl, file: fileId } = await uploadRes.json()

    // 2. Upload the video to the signed URL
    // Client sends the video as multipart form data
    const videoBuffer = req.body as Buffer
    const contentType = req.headers['content-type'] || 'video/mp4'

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: videoBuffer,
    })
    if (!putRes.ok) throw new Error(`Video upload failed: ${putRes.status}`)

    // 3. Start processing
    const processBody = {
      processor: 'video2anim',
      params: [{
        formats: ['bvh', 'fbx', 'glb'],
        fps: req.query.fps ? Number(req.query.fps) : 30,
        faceTracking: req.query.face === 'true',
        handTracking: req.query.hands === 'true',
        footLockMode: 'auto',
        poseFilteringStrength: 0.6,
      }],
    }

    const processRes = await fetch(`${DM_BASE}/process/${fileId}`, {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processBody),
    })
    if (!processRes.ok) throw new Error(`Processing failed: ${processRes.status}`)
    const { rid } = await processRes.json()

    res.json({ rid, cookie })
  } catch (err: any) {
    console.error('[DeepMotion] Process error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/deepmotion/status/:rid — poll processing status */
router.get('/status/:rid', async (req, res) => {
  try {
    const cookie = await authenticate()
    const statusRes = await fetch(`${DM_BASE}/status/${req.params.rid}`, {
      headers: { Cookie: cookie },
    })
    if (!statusRes.ok) throw new Error(`Status check failed: ${statusRes.status}`)
    const data = await statusRes.json()
    res.json(data)
  } catch (err: any) {
    console.error('[DeepMotion] Status error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/deepmotion/download/:rid — get download URLs */
router.get('/download/:rid', async (req, res) => {
  try {
    const cookie = await authenticate()
    const dlRes = await fetch(`${DM_BASE}/download/${req.params.rid}`, {
      headers: { Cookie: cookie },
    })
    if (!dlRes.ok) throw new Error(`Download failed: ${dlRes.status}`)
    const data = await dlRes.json()
    res.json(data)
  } catch (err: any) {
    console.error('[DeepMotion] Download error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router
```

- [ ] **Step 2: Mount routes in server/index.ts**

Add import near the other route imports (~line 50):
```typescript
import deepmotionRoutes from './routes/deepmotion'
```

Add route mount near line 177 (after other API routes):
```typescript
app.use('/api/deepmotion', requireAuth, aiRateLimiter, deepmotionRoutes)
```

- [ ] **Step 3: Add env vars to server/.env**

Append to `server/.env`:
```
DEEPMOTION_CLIENT_ID=
DEEPMOTION_CLIENT_SECRET=
```

- [ ] **Step 4: Verify route responds**

```bash
curl -X POST http://localhost:3001/api/deepmotion/process -H "Content-Type: video/mp4" -v
```
Expected: 401 (no auth) or 500 with "DeepMotion credentials not configured"

- [ ] **Step 5: Commit**

```
feat(server): add DeepMotion API proxy routes for cloud motion capture
```

---

### Task 4: DeepMotion Client Service + Store

**Files:**
- Create: `src/services/deepMotionClient.ts`
- Create: `src/stores/useDeepMotionStore.ts`

- [ ] **Step 1: Create deepMotionClient.ts**

```typescript
/**
 * Client-side DeepMotion API — calls our Express proxy.
 */

export interface DeepMotionJobStatus {
  status: 'PROCESSING' | 'SUCCESS' | 'FAILURE'
  progress?: number
  message?: string
}

export interface DeepMotionDownload {
  glb?: string
  bvh?: string
  fbx?: string
  mp4?: string
}

/** Upload video and start DeepMotion processing */
export async function startDeepMotionJob(
  videoBlob: Blob,
  options: { fps?: number; face?: boolean; hands?: boolean } = {}
): Promise<{ rid: string }> {
  const params = new URLSearchParams()
  if (options.fps) params.set('fps', String(options.fps))
  if (options.face) params.set('face', 'true')
  if (options.hands) params.set('hands', 'true')

  const res = await fetch(`/api/deepmotion/process?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': videoBlob.type || 'video/mp4' },
    body: videoBlob,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

/** Poll job status */
export async function pollDeepMotionStatus(rid: string): Promise<DeepMotionJobStatus> {
  const res = await fetch(`/api/deepmotion/status/${rid}`)
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`)
  return res.json()
}

/** Get download URLs for completed job */
export async function getDeepMotionDownloads(rid: string): Promise<DeepMotionDownload> {
  const res = await fetch(`/api/deepmotion/download/${rid}`)
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  return res.json()
}

/** Download a GLB file from DeepMotion result URL */
export async function downloadDeepMotionGLB(url: string): Promise<Blob> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GLB download failed: ${res.status}`)
  return res.blob()
}
```

- [ ] **Step 2: Create useDeepMotionStore.ts**

```typescript
/**
 * DeepMotion Store — manages cloud motion capture workflow.
 */
import { create } from 'zustand'

type DeepMotionStatus = 'idle' | 'uploading' | 'processing' | 'downloading' | 'done' | 'error'

interface DeepMotionState {
  status: DeepMotionStatus
  rid: string | null
  progress: number
  statusMessage: string | null
  error: string | null
  resultGlbUrl: string | null

  // Settings
  fps: number
  faceTracking: boolean
  handTracking: boolean

  // Actions
  setStatus: (status: DeepMotionStatus, message?: string) => void
  setRid: (rid: string) => void
  setProgress: (progress: number) => void
  setError: (error: string) => void
  setResultGlbUrl: (url: string) => void
  setFps: (fps: number) => void
  setFaceTracking: (on: boolean) => void
  setHandTracking: (on: boolean) => void
  reset: () => void
}

const initialState = {
  status: 'idle' as const,
  rid: null,
  progress: 0,
  statusMessage: null,
  error: null,
  resultGlbUrl: null,
  fps: 30,
  faceTracking: false,
  handTracking: false,
}

export const useDeepMotionStore = create<DeepMotionState>((set) => ({
  ...initialState,

  setStatus: (status, message) => set({ status, statusMessage: message ?? null, error: null }),
  setRid: (rid) => set({ rid }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ status: 'error', error }),
  setResultGlbUrl: (url) => set({ resultGlbUrl: url, status: 'done' }),
  setFps: (fps) => set({ fps }),
  setFaceTracking: (on) => set({ faceTracking: on }),
  setHandTracking: (on) => set({ handTracking: on }),
  reset: () => {
    const prev = useDeepMotionStore.getState()
    if (prev.resultGlbUrl) URL.revokeObjectURL(prev.resultGlbUrl)
    set(initialState)
  },
}))
```

- [ ] **Step 3: Commit**

```
feat: add DeepMotion client service and store
```

---

### Task 5: DeepMotion Panel UI

**Files:**
- Create: `src/components/panels/DeepMotionPanel.tsx`

- [ ] **Step 1: Create DeepMotionPanel**

```tsx
/**
 * DeepMotion Panel — upload video for cloud-based premium motion capture.
 * Uses DeepMotion Animate 3D API via Express proxy.
 */
import { useCallback, useRef, useState } from 'react'
import { Upload, Cloud, X, Download, Loader2, AlertCircle } from 'lucide-react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useDeepMotionStore } from '@/stores/useDeepMotionStore'
import { useMotionCaptureStore } from '@/stores/useMotionCaptureStore'
import { use3DAnimationStore } from '@/stores/use3DAnimationStore'
import { use3DRigStore } from '@/stores/use3DRigStore'
import {
  startDeepMotionJob,
  pollDeepMotionStatus,
  getDeepMotionDownloads,
  downloadDeepMotionGLB,
} from '@/services/deepMotionClient'
import { autoRemapClip } from '@/services/gltfUtils'
import { save3DBlob } from '@/services/character3dDB'
import { PanelDropZone } from '@/components/ui/panel-controls/PanelDropZone'
import { PanelToggle } from '@/components/ui/panel-controls/PanelToggle'
import { cn } from '@/lib/utils'
import { logger } from '@/utils/logger'

interface Props {
  mode: '2d' | '3d'
}

export default function DeepMotionPanel({ mode }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const {
    status, progress, statusMessage, error, fps,
    faceTracking, handTracking,
    setFps, setFaceTracking, setHandTracking,
    setStatus, setRid, setProgress, setError, setResultGlbUrl, reset,
  } = useDeepMotionStore()

  const activeRig = use3DRigStore((s) => s.getActiveRig())

  const handleFile = useCallback((file: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoUrl(URL.createObjectURL(file))
    setVideoBlob(file)
    reset()
  }, [videoUrl, reset])

  const handleClear = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoUrl(null)
    setVideoBlob(null)
    reset()
  }, [videoUrl, reset])

  const handleProcess = useCallback(async () => {
    if (!videoBlob || status !== 'idle') return

    try {
      // 1. Upload
      setStatus('uploading', 'Uploading video to DeepMotion...')
      const { rid } = await startDeepMotionJob(videoBlob, { fps, face: faceTracking, hands: handTracking })
      setRid(rid)

      // 2. Poll
      setStatus('processing', 'Processing motion capture...')
      let done = false
      while (!done) {
        await new Promise((r) => setTimeout(r, 3000))
        const statusData = await pollDeepMotionStatus(rid)
        if (statusData.progress) setProgress(statusData.progress)
        if (statusData.status === 'SUCCESS') done = true
        if (statusData.status === 'FAILURE') throw new Error(statusData.message || 'Processing failed')
      }

      // 3. Download GLB
      setStatus('downloading', 'Downloading animation...')
      const downloads = await getDeepMotionDownloads(rid)
      const glbUrl = downloads.glb
      if (!glbUrl) throw new Error('No GLB output available')

      const glbBlob = await downloadDeepMotionGLB(glbUrl)
      const localUrl = URL.createObjectURL(glbBlob)
      setResultGlbUrl(localUrl)

    } catch (err: any) {
      logger.error('[DeepMotion] Error:', err)
      setError(err.message || 'DeepMotion processing failed')
    }
  }, [videoBlob, status, fps, faceTracking, handTracking, setStatus, setRid, setProgress, setError, setResultGlbUrl])

  const handleAddToLibrary = useCallback(async () => {
    const resultUrl = useDeepMotionStore.getState().resultGlbUrl
    if (!resultUrl) return

    try {
      const res = await fetch(resultUrl)
      const glbBlob = await res.blob()

      // Parse GLB to extract animation clips
      const loader = new GLTFLoader()
      const arrayBuffer = await glbBlob.arrayBuffer()
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.parse(arrayBuffer, '', resolve, reject)
      })

      if (!gltf.animations?.length) {
        setError('No animations found in GLB')
        return
      }

      let clip: THREE.AnimationClip = gltf.animations[0]

      // Remap if active 3D rig
      if (activeRig) {
        clip = autoRemapClip(
          clip.clone(),
          activeRig.skeletonTree.boneMapping,
          activeRig.skeletonTree.bones.map((b) => b.name)
        )
      }

      // Store
      const blobId = `deepmotion-${Date.now()}`
      await save3DBlob(blobId, glbBlob)

      use3DAnimationStore.getState().addAnimation({
        id: `anim-dm-${Date.now()}`,
        name: `DeepMotion Capture (${Math.round(clip.duration)}s)`,
        glbBlobId: blobId,
        durationSeconds: clip.duration,
        fps,
        source: 'imported',
        tags: ['mocap', 'deepmotion', 'cloud'],
        createdAt: Date.now(),
      })
    } catch (err: any) {
      logger.error('[DeepMotion] Add to library error:', err)
      setError(err.message)
    }
  }, [activeRig, fps, setError])

  const isProcessing = status === 'uploading' || status === 'processing' || status === 'downloading'

  return (
    <div className="p-3 space-y-3">
      {/* Info */}
      <div className="p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10">
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          Upload a video for cloud-based AI motion capture. DeepMotion extracts
          high-quality 3D skeleton animation with optional face and hand tracking.
        </p>
      </div>

      {/* Video upload */}
      <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/mov" onChange={(e) => {
        const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''
      }} className="hidden" />

      {videoUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-[#3a3a3a]">
          <video src={videoUrl} controls className="w-full max-h-40 object-contain bg-black" />
          <button onClick={handleClear} className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-gray-300 hover:text-white">
            <X size={12} />
          </button>
        </div>
      ) : (
        <PanelDropZone
          icon={Upload}
          label="Drop video or click to upload"
          sublabel="MP4, WebM, or MOV"
          isDragging={isDragging}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('video/')) handleFile(f) }}
          onClick={() => fileRef.current?.click()}
        />
      )}

      {/* Settings */}
      {videoUrl && (
        <div className="space-y-2 p-3 bg-zinc-800/20 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">FPS</span>
            <div className="flex gap-1">
              {[24, 30, 60].map((f) => (
                <button key={f} onClick={() => setFps(f)} className={cn(
                  'px-2 py-1 rounded text-[10px] font-medium border',
                  fps === f ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-black/20 text-zinc-400 border-white/5'
                )}>{f}</button>
              ))}
            </div>
          </div>
          <PanelToggle label="Face Tracking" checked={faceTracking} onChange={setFaceTracking} />
          <PanelToggle label="Hand Tracking" checked={handTracking} onChange={setHandTracking} />
        </div>
      )}

      {/* Process button */}
      {videoUrl && status === 'idle' && (
        <button onClick={handleProcess} className="w-full py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors">
          <Cloud size={14} /> Process with DeepMotion
        </button>
      )}

      {/* Progress */}
      {isProcessing && (
        <div className="p-3 bg-zinc-800/30 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-blue-400" />
            <span className="text-xs text-zinc-300">{statusMessage}</span>
          </div>
          {progress > 0 && (
            <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-start gap-2">
          <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-300">{error}</p>
        </div>
      )}

      {/* Result */}
      {status === 'done' && (
        <button onClick={handleAddToLibrary} className="w-full py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs font-medium flex items-center justify-center gap-2 border border-green-500/20 transition-colors">
          <Download size={14} /> Add to Animation Library
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify DeepMotion panel renders in Animation tab**

Open rig editor → ANIMATION tab → expand DeepMotion section. Verify video upload, settings, and process button appear.

- [ ] **Step 3: Commit**

```
feat(panels): add DeepMotion panel for cloud motion capture
```

---

### Task 6: Wire Up Express Body Parser for Large Video Uploads

**Files:**
- Modify: `server/index.ts`

- [ ] **Step 1: Add raw body parser for deepmotion route**

The DeepMotion route receives raw video bytes. Add before the route mount:

```typescript
// Raw body parser for DeepMotion video uploads (up to 100MB)
app.use('/api/deepmotion/process', express.raw({ type: 'video/*', limit: '100mb' }))
```

This must appear BEFORE the `app.use('/api/deepmotion', ...)` mount.

- [ ] **Step 2: Commit**

```
fix(server): add raw body parser for DeepMotion video uploads
```

---

### Task 7: Final Integration Test + Doc Update

**Files:**
- Modify: `docs/feature-list.md`
- Modify: `docs/codebase/10-panels.md`

- [ ] **Step 1: End-to-end test**

1. Open editor → click character → "Edit Rig"
2. Verify dropdown shows "2D Rig Editor" with option to switch to "3D Rig Editor"
3. Verify RIG tab shows rig tools, ANIMATION tab shows 4 sections
4. In ANIMATION tab, expand "Motion Capture (Video)" → upload a video → verify MediaPipe processes it
5. Expand "DeepMotion" → verify UI renders (processing will fail without API keys, that's expected)
6. Switch dropdown to "3D Rig Editor" → verify content swaps correctly
7. Verify back button returns to correct panel

- [ ] **Step 2: Update docs/feature-list.md**

Add under the Animation/Rig section:
```markdown
- **Unified Rig Editor Panel** — 2D/3D dropdown + RIG/ANIMATION tabs
- **DeepMotion Cloud MoCap** — Premium video-to-3D animation via DeepMotion API
```

- [ ] **Step 3: Update docs/codebase/10-panels.md**

Add entries for new components:
- `RigEditorPanel` — unified rig editor with dropdown + tabs
- `RigEditorAnimationTab` — animation tab content
- `DeepMotionPanel` — cloud motion capture UI

- [ ] **Step 4: Commit + push**

```
feat(rig-editor): complete rig editor restructure + DeepMotion integration

- Unified panel with 2D/3D dropdown selector
- RIG and ANIMATION tabs
- Animation tab: AI Animation, Webcam Tracking, Video MoCap, DeepMotion
- DeepMotion Express proxy routes for cloud processing
- DeepMotion client service + Zustand store
```
