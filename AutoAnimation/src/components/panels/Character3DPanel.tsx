/**
 * 3D Character Panel — Import, generate, and manage 3D humanoid characters.
 *
 * Two views:
 * - List: Grid of saved 3D characters with drag-to-canvas
 * - Create: Import GLB or generate via Meshy API
 *
 * Enforces a 50k vertex limit on uploaded models. If exceeded, offers
 * client-side mesh simplification (meshoptimizer WASM) to reduce vertex count.
 */
import { useState, useMemo, useRef, useCallback } from 'react'
import {
  Upload,
  Plus,
  Trash2,
  Box,
  Loader2,
  ArrowLeft,
  Wand2,
  FolderOpen,
  AlertTriangle,
  Scissors,
  X,
  Bone,
  Check,
  AlertCircle,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useEditorStore } from '@/stores'
import { save3DBlob, blobToUrl } from '@/services/character3dDB'
import { parseGLTF, analyzeGLTF } from '@/services/gltfUtils'
import { convertFbxBufferToGlb, parseFbxToScene, exportSceneToGlb } from '@/services/fbxConverter'
import { extractFbxFromZip, collectFbxFromFolder, cleanupBundleBlobUrls } from '@/services/fbxZipExtractor'
import { simplifyScene, simplifyAndExportGlb, MAX_VERTEX_COUNT } from '@/services/meshSimplifier'
import type { Saved3DCharacter } from '@/types/character3d'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { useConfirmDialog } from '@/stores/useConfirmDialogStore'
import { toast } from '@/stores/useToastStore'

type ViewMode = 'list' | 'create'

export function Character3DPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  return viewMode === 'list' ? (
    <Character3DListView onCreateNew={() => setViewMode('create')} />
  ) : (
    <Character3DCreateView onBack={() => setViewMode('list')} />
  )
}

// ─── List View ──────────────────────────────────────────────────────────────

export function Character3DListView({ onCreateNew }: { onCreateNew: () => void }) {
  const characters = useSaved3DCharactersStore((s) => s.characters)
  const removeCharacter = useSaved3DCharactersStore((s) => s.removeCharacter)
  const selectCharacter = useSaved3DCharactersStore((s) => s.selectCharacter)
  const selectedId = useSaved3DCharactersStore((s) => s.selectedCharacterId)
  const add3DCharacter = use3DCharacterStore((s) => s.add3DCharacter)
  const confirm = useConfirmDialog()

  const [searchQuery, setSearchQuery] = useState('')

  const filteredCharacters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return characters
    return characters.filter((c) => c.name.toLowerCase().includes(q))
  }, [characters, searchQuery])

  const handleDragStart = (e: React.DragEvent, char: Saved3DCharacter) => {
    e.dataTransfer.setData('application/x-saved-3d-character', JSON.stringify({ id: char.id }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handlePlaceOnCanvas = (char: Saved3DCharacter) => {
    add3DCharacter({
      name: char.name,
      saved3DCharacterId: char.id,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
      zIndex: 0,
      visible: true,
      locked: false,
      activeAnimationId: null,
      animationSpeed: 1,
      voiceId: null,
      color: '',
      visemeFaceMapping: char.defaultVisemeFaceMapping,
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Search (Cinema standard) ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 3D characters..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {filteredCharacters.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredCharacters.map((char) => (
              <div
                key={char.id}
                draggable
                onDragStart={(e) => handleDragStart(e, char)}
                onClick={() => selectCharacter(char.id)}
                onDoubleClick={() => handlePlaceOnCanvas(char)}
                className={cn(
                  'group relative rounded-lg overflow-hidden cursor-pointer border transition-all duration-200',
                  selectedId === char.id
                    ? 'border-accent ring-2 ring-accent/30'
                    : 'border-white/5 hover:border-panel-border',
                )}
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-panel-bg flex items-center justify-center">
                  {char.thumbnailDataUrl ? (
                    <img
                      src={char.thumbnailDataUrl}
                      alt={char.name}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-panel-surface-hover to-panel-surface flex items-center justify-center">
                      <Box size={28} className="text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Selection badge */}
                {selectedId === char.id && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center z-10">
                    <Check size={12} className="text-white" />
                  </div>
                )}

                {/* Name & Info */}
                <div className="p-2 bg-panel-surface">
                  <p className="text-xs text-gray-300 truncate font-medium">{char.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                      {char.skeletonType}
                    </span>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 flex-shrink-0">
                      {(char.polyCount / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>

                {/* Hover action buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      selectCharacter(char.id)
                      useEditorStore.getState().setLeftPanelActiveTab('rig-editor-3d')
                    }}
                    className="w-6 h-6 bg-panel-bg/80 rounded-full flex items-center justify-center text-gray-400 hover:bg-green-500 hover:text-white transition-colors"
                    title="Rig character"
                  >
                    <Bone size={11} />
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (!(await confirm({ title: 'Delete character', description: 'Delete this 3D character?' })))
                        return
                      removeCharacter(char.id)
                    }}
                    className="w-6 h-6 bg-panel-bg/80 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-colors"
                    title="Delete character"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Box size={28} className="mb-3" />
            <span className="text-sm text-gray-400">
              {characters.length === 0 ? 'No 3D characters yet' : 'No characters found'}
            </span>
            <span className="text-xs text-gray-600 mt-1">
              {characters.length === 0 ? 'Import a GLB model or generate with AI' : 'Try a different search term'}
            </span>
          </div>
        )}
      </div>

      {/* ── Footer (Cinema standard) ── */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5">
        <button
          onClick={onCreateNew}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
        >
          <Plus size={13} />
          Import 3D Character
        </button>
      </div>
    </div>
  )
}

// ─── Create View ────────────────────────────────────────────────────────────

/** Pending model awaiting vertex limit decision */
interface PendingHighPolyModel {
  /** GLB blob (for GLB/ZIP imports) OR null (for FBX — scene not yet exported) */
  glbBlob: Blob | null
  displayName: string
  gltf: GLTF
  /** Raw parsed scene + animations (for FBX imports, to defer GLB export until after simplify) */
  parsedScene?: { scene: THREE.Group; animations: THREE.AnimationClip[] }
  vertexCount: number
  polyCount: number
}

export function Character3DCreateView({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Vertex limit modal state
  const [pendingModel, setPendingModel] = useState<PendingHighPolyModel | null>(null)
  const [isSimplifying, setIsSimplifying] = useState(false)

  const addCharacter = useSaved3DCharactersStore((s) => s.addCharacter)
  const setBlobUrl = useSaved3DCharactersStore((s) => s.setBlobUrl)

  /** Save analyzed GLB to library */
  const saveToLibrary = useCallback(
    async (glbBlob: Blob, displayName: string, gltf: GLTF) => {
      const analysis = analyzeGLTF(gltf)

      const blobId = `glb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      await save3DBlob(blobId, glbBlob)
      const blobUrl = blobToUrl(glbBlob)

      const charName = name.trim() || displayName
      const saved3DChar: Saved3DCharacter = {
        id: `char3d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: charName,
        glbBlobId: blobId,
        thumbnailDataUrl: analysis.thumbnailDataUrl,
        skeletonType: analysis.skeletonType,
        boneMapping: analysis.boneMapping,
        polyCount: analysis.polyCount,
        createdAt: Date.now(),
      }

      addCharacter(saved3DChar)
      setBlobUrl(blobId, blobUrl)
      setName('')
      setTimeout(() => onBack(), 500)
    },
    [name, addCharacter, setBlobUrl, onBack],
  )

  /** Shared pipeline for GLB/ZIP: load → check vertices → finalize or prompt */
  const finalizeGlb = useCallback(
    async (glbBlob: Blob, displayName: string) => {
      setImportProgress('Loading model...')
      const buffer = await glbBlob.arrayBuffer()
      const gltf = await parseGLTF(buffer)

      setImportProgress('Analyzing model...')
      const analysis = analyzeGLTF(gltf)

      if (analysis.vertexCount > MAX_VERTEX_COUNT) {
        setPendingModel({
          glbBlob,
          displayName,
          gltf,
          vertexCount: analysis.vertexCount,
          polyCount: analysis.polyCount,
        })
        setIsImporting(false)
        return
      }

      setImportProgress('Saving character...')
      await saveToLibrary(glbBlob, displayName, gltf)
      setImportProgress('Done!')
    },
    [saveToLibrary],
  )

  /**
   * FBX pipeline: parse → check vertices → prompt if needed.
   * Defers GLB export until after simplification to avoid
   * ERR_BLOB_OUT_OF_MEMORY on large models.
   */
  const finalizeFbxScene = useCallback(
    async (scene: THREE.Group, animations: THREE.AnimationClip[], displayName: string) => {
      setImportProgress('Analyzing model...')
      let vertexCount = 0
      let polyCount = 0
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const geo = (obj as THREE.Mesh).geometry
          if (geo?.attributes?.position) vertexCount += geo.attributes.position.count
          if (geo?.index) polyCount += geo.index.count / 3
          else if (geo?.attributes?.position) polyCount += geo.attributes.position.count / 3
        }
      })

      if (vertexCount > MAX_VERTEX_COUNT) {
        setPendingModel({
          glbBlob: null,
          displayName,
          gltf: { scene, animations, scenes: [scene], cameras: [], asset: {}, parser: null as any, userData: {} },
          parsedScene: { scene, animations },
          vertexCount,
          polyCount,
        })
        setIsImporting(false)
        return
      }

      // Under limit — export to GLB and save
      setImportProgress('Exporting to GLB...')
      const glbBlob = await exportSceneToGlb(scene, animations)
      const buffer = await glbBlob.arrayBuffer()
      const gltf = await parseGLTF(buffer)
      setImportProgress('Saving character...')
      await saveToLibrary(glbBlob, displayName, gltf)
      setImportProgress('Done!')
    },
    [saveToLibrary],
  )

  /** Run client-side mesh simplification via meshoptimizer */
  const handleSimplify = useCallback(async () => {
    if (!pendingModel) return

    setIsSimplifying(true)
    setImportError(null)

    try {
      // For FBX imports (parsedScene set), simplify in-place then export once.
      // For GLB imports, use the old simplify+export path.
      if (pendingModel.parsedScene) {
        const { scene, animations } = pendingModel.parsedScene

        setImportProgress('Simplifying mesh (reducing vertices)...')
        const result = await simplifyScene(scene, MAX_VERTEX_COUNT)

        setImportProgress('Exporting to GLB...')
        const glbBlob = await exportSceneToGlb(result.scene, animations)

        setImportProgress('Loading simplified model...')
        const buffer = await glbBlob.arrayBuffer()
        const newGltf = await parseGLTF(buffer)

        setImportProgress('Saving character...')
        await saveToLibrary(glbBlob, pendingModel.displayName, newGltf)

        console.log(
          `[meshSimplifier] Reduced ${result.originalVertices.toLocaleString()} → ${result.newVertices.toLocaleString()} vertices (${(result.reductionRatio * 100).toFixed(1)}% reduction)`,
        )
      } else {
        setImportProgress('Simplifying mesh (reducing vertices)...')
        const { blob: simplifiedBlob, result } = await simplifyAndExportGlb(
          pendingModel.gltf.scene,
          pendingModel.gltf.animations,
          MAX_VERTEX_COUNT,
        )

        setImportProgress('Loading simplified model...')
        const simplifiedBuffer = await simplifiedBlob.arrayBuffer()
        const newGltf = await parseGLTF(simplifiedBuffer)

        setImportProgress('Saving character...')
        await saveToLibrary(simplifiedBlob, pendingModel.displayName, newGltf)

        console.log(
          `[meshSimplifier] Reduced ${result.originalVertices.toLocaleString()} → ${result.newVertices.toLocaleString()} vertices (${(result.reductionRatio * 100).toFixed(1)}% reduction)`,
        )
      }

      setPendingModel(null)
      setImportProgress('Done!')
    } catch (err) {
      console.error('Failed to simplify model:', err)
      setImportError(err instanceof Error ? err.message : 'Failed to simplify model')
    } finally {
      setIsSimplifying(false)
    }
  }, [pendingModel, saveToLibrary])

  /** Cancel the pending high-poly model */
  const handleCancelHighPoly = useCallback(() => {
    setPendingModel(null)
    setImportError(null)
    setImportProgress('')
  }, [])

  /** Process a single file (GLB, GLTF, FBX, or ZIP) */
  const processFile = useCallback(
    async (file: File) => {
      const lower = file.name.toLowerCase()
      const isZip = lower.endsWith('.zip')
      const isFbx = lower.endsWith('.fbx')
      const isGlb = lower.endsWith('.glb') || lower.endsWith('.gltf')

      if (!isGlb && !isFbx && !isZip) {
        setImportError('Supported formats: .glb, .gltf, .fbx, .zip (FBX + textures)')
        return
      }

      setIsImporting(true)
      setImportError(null)

      try {
        let glbBlob: Blob
        let displayName: string

        if (isZip) {
          setImportProgress('Extracting ZIP archive...')
          const bundle = await extractFbxFromZip(file)
          displayName = bundle.fbxFilename.replace(/\.fbx$/i, '')

          setImportProgress('Converting FBX to GLB (with textures)...')
          glbBlob = await convertFbxBufferToGlb(bundle.fbxBuffer, bundle.textureBlobUrls)
          cleanupBundleBlobUrls(bundle)
        } else if (isFbx) {
          displayName = file.name.replace(/\.fbx$/i, '')
          setImportProgress('Parsing FBX...')
          const fbxBuffer = await file.arrayBuffer()
          const parsed = await parseFbxToScene(fbxBuffer)
          if (parsed.strippedTextures > 0) {
            toast.warning(
              `${parsed.strippedTextures} texture(s) missing — FBX references external files. Re-import as a ZIP with texture files included for full materials.`,
            )
          }
          // FBX path: parse → analyze → simplify → export (deferred)
          await finalizeFbxScene(parsed.scene, parsed.animations, displayName)
          return
        } else {
          displayName = file.name.replace(/\.(glb|gltf)$/i, '')
          glbBlob = file
        }

        await finalizeGlb(glbBlob, displayName)
      } catch (err) {
        console.error('Failed to import model:', err)
        setImportError(err instanceof Error ? err.message : 'Failed to import model')
      } finally {
        setIsImporting(false)
      }
    },
    [finalizeGlb],
  )

  /** Process a folder upload (webkitdirectory) */
  const processFolder = useCallback(
    async (files: FileList) => {
      setIsImporting(true)
      setImportError(null)

      try {
        setImportProgress('Scanning folder for FBX + textures...')
        const bundle = await collectFbxFromFolder(files)
        const displayName = bundle.fbxFilename.replace(/\.fbx$/i, '')

        setImportProgress('Converting FBX to GLB (with textures)...')
        const glbBlob = await convertFbxBufferToGlb(bundle.fbxBuffer, bundle.textureBlobUrls)
        cleanupBundleBlobUrls(bundle)

        await finalizeGlb(glbBlob, displayName)
      } catch (err) {
        console.error('Failed to import from folder:', err)
        setImportError(err instanceof Error ? err.message : 'Failed to import from folder')
      } finally {
        setIsImporting(false)
      }
    },
    [finalizeGlb],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) processFolder(files)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  return (
    <PanelLayout
      icon={Box}
      title="Import 3D Character"
      iconClassName="text-emerald-400"
      trailing={
        <button onClick={onBack} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft size={14} />
        </button>
      }
    >
      {/* Vertex Limit Warning */}
      {pendingModel && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-300">Model exceeds vertex limit</p>
              <p className="text-[11px] text-gray-400">
                <span className="text-white font-medium">{pendingModel.displayName}</span> has{' '}
                <span className="text-amber-300 font-mono">{pendingModel.vertexCount.toLocaleString()}</span> vertices (
                {(pendingModel.polyCount / 1000).toFixed(1)}k tris). Max is{' '}
                <span className="text-white font-mono">{MAX_VERTEX_COUNT.toLocaleString()}</span>.
              </p>
            </div>
          </div>

          {isSimplifying && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-panel-surface rounded-lg">
              <Loader2 size={12} className="text-accent animate-spin" />
              <p className="text-[11px] text-accent">{importProgress}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSimplify}
              disabled={isSimplifying}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-accent/20 border border-accent/40 rounded-lg text-xs text-accent hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:pointer-events-none font-medium"
            >
              <Scissors size={12} />
              Auto-Simplify
            </button>
            <button
              onClick={handleCancelHighPoly}
              disabled={isSimplifying}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-panel-surface border border-panel-border rounded-lg text-xs text-gray-400 hover:text-white hover:border-[#4a4a4a] transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Character Name */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Character Name</label>
        <div className="relative">
          <Box size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Character"
            className="w-full bg-panel-surface border border-panel-border rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-600 focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* File Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragOver
            ? 'border-accent bg-accent/10'
            : 'border-panel-border hover:border-accent/30 hover:bg-panel-surface-hover/30',
          (isImporting || pendingModel) && 'pointer-events-none opacity-50',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf,.fbx,.zip"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is non-standard but widely supported
          webkitdirectory=""
          directory=""
          onChange={handleFolderSelect}
          className="hidden"
        />

        {isImporting ? (
          <div className="space-y-2">
            <Loader2 size={24} className="mx-auto text-accent animate-spin" />
            <p className="text-xs text-accent font-medium">{importProgress}</p>
          </div>
        ) : (
          <>
            <Upload size={20} className="mx-auto text-gray-500 mb-2" />
            <p className="text-xs text-gray-400">
              Drop a <span className="text-accent font-medium">.glb</span>,{' '}
              <span className="text-accent font-medium">.fbx</span>, or{' '}
              <span className="text-accent font-medium">.zip</span> file here
            </p>
            <p className="text-[10px] text-gray-600 mt-1">ZIP: FBX + texture files for full material import</p>
            <p className="text-[10px] text-gray-600">
              Max {(MAX_VERTEX_COUNT / 1000).toFixed(0)}k vertices (auto-simplify available)
            </p>
          </>
        )}
      </div>

      {/* Folder Upload */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          folderInputRef.current?.click()
        }}
        disabled={isImporting || !!pendingModel}
        className="w-full py-2 px-3 bg-panel-surface border border-panel-border rounded-lg text-xs text-gray-400 hover:text-white hover:border-[#4a4a4a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
      >
        <FolderOpen size={12} />
        Upload Folder (FBX + Textures)
      </button>

      {/* Error */}
      {importError && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{importError}</p>
        </div>
      )}

      {/* AI Generation */}
      <div className="border-t border-white/5 pt-3">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium mb-2">AI Generation</p>
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-panel-surface-hover rounded-lg text-xs text-gray-500 cursor-not-allowed"
        >
          <Wand2 size={12} />
          Generate with Meshy AI (coming soon)
        </button>
      </div>
    </PanelLayout>
  )
}
