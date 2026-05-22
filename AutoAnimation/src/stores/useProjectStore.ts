import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { projectService } from '@/services/projectService'
import type { ProjectListItem } from '@/types/database'
import { useCharacterConfigStore } from './useCharacterConfigStore'
import { useCharacterPartsStore } from './useCharacterPartsStore'
import { useVoiceStore } from './useVoiceStore'
import { useAnimationStore } from './useAnimationStore'
import { useTimelineStore } from './useTimelineStore'
import { useEditorStore } from './useEditorStore'
import { useCanvasStore } from './useCanvasStore'
import { usePlaybackStore } from './usePlaybackStore'
import { useMultiCharacterStore } from './useMultiCharacterStore'
import { useTextOverlayStore } from './useTextOverlayStore'
import { useShapeStore } from './useShapeStore'
import { useMediaStore } from './useMediaStore'
import { useVideoLayerStore } from './useVideoLayerStore'
import { useKeyframeStore } from './useKeyframeStore'
import { useSVGObjectStore } from './useSVGObjectStore'
import { useAIAnimationStore } from './useAIAnimationStore'
import { useHTMLTemplateLayerStore } from './useHTMLTemplateLayerStore'
import { useCameraStore } from './useCameraStore'
import { useRigStore } from './useRigStore'
import { useAvatarCharacterStore } from './useAvatarCharacterStore'
import { useProjectSchemaStore } from './useProjectSchemaStore'
import { useLayerTreeStore } from './useLayerTreeStore'
import { cacheRigForCharacter } from '@/services/rigCache'
import { generateProjectThumbnail } from '@/utils/thumbnail'
import { toast } from './useToastStore'

interface ProjectState {
  // Current project
  currentProjectId: string | null
  currentProjectName: string

  // Project list
  projects: ProjectListItem[]

  // Status
  isSaving: boolean
  isLoading: boolean
  lastSaved: Date | null
  error: string | null

  // Auto-save
  autoSaveEnabled: boolean
  autoSaveIntervalId: number | null
}

interface ProjectActions {
  // Project management
  createProject: (name?: string) => Promise<string>
  loadProject: (id: string) => Promise<void>
  saveProject: (options?: { silent?: boolean }) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  listProjects: () => Promise<void>
  renameProject: (name: string) => Promise<void>

  // Auto-save
  enableAutoSave: (intervalMs?: number) => void
  disableAutoSave: () => void

  // Reset
  resetAllStores: () => void

  // Local persistence (no Supabase)
  loadLocalProject: () => void

  // Status
  setError: (error: string | null) => void
  clearError: () => void
}

export const useProjectStore = create<ProjectState & ProjectActions>()(
  immer((set, get) => ({
    // Initial state
    currentProjectId: null,
    currentProjectName: 'Untitled Project',
    projects: [],
    isSaving: false,
    isLoading: false,
    lastSaved: null,
    error: null,
    autoSaveEnabled: false,
    autoSaveIntervalId: null,

    // ============================================
    // Reset all content stores (for new project)
    // ============================================

    resetAllStores: () => {
      console.log('[ProjectStore] Resetting all content stores for new project')

      // Character & sprite stores
      useCharacterConfigStore.getState().reset()
      useCharacterPartsStore.getState().resetAllTransforms()

      // Voice & dialogue stores
      useVoiceStore.getState().reset()
      useMultiCharacterStore.getState().reset()

      // Canvas stores
      useCanvasStore.getState().clearCanvas()
      useTextOverlayStore.getState().reset()
      useShapeStore.getState().clearShapes()
      useMediaStore.getState().reset()
      useVideoLayerStore.getState().clearAll()
      useHTMLTemplateLayerStore.getState().clearAll()

      // Animation stores
      useAnimationStore.getState().clearCanvas()
      useKeyframeStore.getState().clearAll()
      useSVGObjectStore.getState().clearComposition()
      useAIAnimationStore.getState().reset()

      // Timeline & playback stores
      useTimelineStore.getState().reset()
      usePlaybackStore.getState().reset()

      // Camera store
      useCameraStore.getState().reset()

      // Rig store
      useRigStore.getState().clearAll()

      // Schema store
      useProjectSchemaStore.getState().reset()

      // Layer tree store
      useLayerTreeStore.getState().reset()

      // Avatar characters
      useAvatarCharacterStore.getState().reset()

      // Clear undo history for timeline and keyframes
      useTimelineStore.temporal.getState().clear()
      useKeyframeStore.temporal.getState().clear()

      // Clear global undo manager history
      import('@/services/undoManager').then(({ clearUndoHistory }) => clearUndoHistory())

      // Reset orchestrator (lazy import to avoid circular dependency)
      import('./useOrchestratorStore').then(({ useOrchestratorStore }) => {
        useOrchestratorStore.getState().reset()
      })
    },

    // ============================================
    // Local project persistence (localStorage fallback)
    // ============================================

    loadLocalProject: () => {
      // Only used when Supabase is not available
      if (projectService.isAvailable()) return

      try {
        const raw = localStorage.getItem('proanimate:local-project')
        if (!raw) return

        const data = JSON.parse(raw)
        const projectName = localStorage.getItem('proanimate:local-project-name') || 'Untitled Project'

        console.log('[ProjectStore] Restoring local project from localStorage')

        // Restore character config
        if (data.sprites) {
          useCharacterConfigStore.getState().loadFromProject({
            savedImages: data.sprites,
            spriteLabels: data.spriteLabels || {},
            visemeMapping: data.visemeMapping || {},
            uploadedImages: data.uploadedImages,
            curvedVisemes: data.curvedVisemes ?? undefined,
            eyeVariants: data.eyeVariants ?? undefined,
            eyebrowVariants: data.eyebrowVariants ?? undefined,
            visemeTransitionMs: data.visemeTransitionMs,
          })
          if (!data.curvedVisemes) {
            useCharacterConfigStore.getState().setUseCurvedVisemes(data.useCurvedVisemes ?? false)
          }
        }

        // Restore character parts
        if (data.partTransforms) {
          useCharacterPartsStore.getState().loadFromProject(data.partTransforms)
        }

        // Restore voice
        if (data.generatedVoices) {
          useVoiceStore.getState().loadFromProject(data.generatedVoices)
        }

        // Restore animations
        if (data.activeAnimations) {
          useAnimationStore.getState().loadFromProject(data.activeAnimations)
        }

        // Restore timeline
        if (data.timeline) {
          useTimelineStore.getState().loadFromProject(data.timeline)
        }

        // Restore aspect ratio
        if (data.aspectRatio) {
          useEditorStore.getState().setAspectRatio(data.aspectRatio)
        }

        // Restore multi-character dialogue
        if (data.dialogueCharacters?.length > 0 || data.dialogueLines?.length > 0) {
          useMultiCharacterStore.getState().loadFromProject({
            characters: data.dialogueCharacters || [],
            dialogueLines: data.dialogueLines || [],
          })
        }

        // Restore rigs
        if (data.rigs && Object.keys(data.rigs).length > 0) {
          useRigStore.getState().loadFromProject({
            rigs: data.rigs,
            poseTracks: data.poseTracks || [],
          })
        }

        // Restore project schema
        if (data.projectSchema) {
          useProjectSchemaStore.getState().loadFromProject(data.projectSchema)
        }

        // Restore layer tree
        if (data.layerTree) {
          useLayerTreeStore.getState().loadFromProject(data.layerTree)
        }

        // Restore avatar characters
        if (data.avatarCharacters?.length > 0) {
          useAvatarCharacterStore.getState().loadFromProject(data.avatarCharacters)
        }

        // Restore text overlays
        if (data.textOverlays?.length > 0) {
          const store = useTextOverlayStore.getState()
          store.reset()
          for (const overlay of data.textOverlays) {
            store.addOverlay(overlay)
          }
        }

        // Restore shapes
        if (data.shapes?.length > 0) {
          const store = useShapeStore.getState()
          store.clearShapes()
          for (const shape of data.shapes) {
            store.addShape(shape)
          }
        }

        // Restore keyframe tracks
        if (data.keyframeTracks?.length > 0) {
          useKeyframeStore.getState().loadFromProject(data.keyframeTracks)
        }

        set((state) => {
          state.currentProjectId = 'local'
          state.currentProjectName = projectName
          state.lastSaved = new Date()
        })
      } catch (err) {
        console.warn('[ProjectStore] Failed to load local project:', err)
      }
    },

    // ============================================
    // Project Management
    // ============================================

    createProject: async (name = 'Untitled Project') => {
      if (!projectService.isAvailable()) {
        throw new Error(
          'Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
        )
      }

      // Reset all content stores before creating the new project
      get().resetAllStores()

      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const projectId = await projectService.create(name)

        set((state) => {
          state.currentProjectId = projectId
          state.currentProjectName = name
          state.isLoading = false
          state.lastSaved = null
        })

        // Refresh project list
        await get().listProjects()

        return projectId
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create project'
        set((state) => {
          state.error = message
          state.isLoading = false
        })
        throw error
      }
    },

    loadProject: async (id: string) => {
      if (!projectService.isAvailable()) {
        throw new Error('Supabase not configured')
      }

      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const data = await projectService.loadState(id)

        if (!data) {
          throw new Error('Project not found')
        }

        // Restore state to all stores
        const {
          project,
          sprites,
          uploadedImages,
          spriteLabels,
          visemeMapping,
          partTransforms,
          generatedVoices,
          activeAnimations,
          timeline,
          curvedVisemes,
          eyeVariants,
          eyebrowVariants,
          useCurvedVisemes,
          visemeTransitionMs,
          dialogueCharacters,
          dialogueLines,
          rigs,
          poseTracks,
          projectSchema,
          layerTree,
          avatarCharacters,
        } = data

        // Restore character config (including curved visemes & eye/eyebrow variants)
        const characterConfigStore = useCharacterConfigStore.getState()
        characterConfigStore.loadFromProject({
          savedImages: sprites,
          spriteLabels,
          visemeMapping: visemeMapping as Record<import('@/types/voice').Viseme, number>,
          uploadedImages,
          curvedVisemes: curvedVisemes ?? undefined,
          eyeVariants: eyeVariants ?? undefined,
          eyebrowVariants: eyebrowVariants ?? undefined,
          visemeTransitionMs,
        })
        // Restore useCurvedVisemes flag (loadFromProject sets it to true if curvedVisemes present,
        // but we also need to respect the saved flag)
        if (!curvedVisemes) {
          characterConfigStore.setUseCurvedVisemes(useCurvedVisemes)
        }

        // Restore character parts transforms
        const characterPartsStore = useCharacterPartsStore.getState()
        characterPartsStore.loadFromProject(partTransforms)

        // Restore voice store
        const voiceStore = useVoiceStore.getState()
        voiceStore.loadFromProject(generatedVoices)

        // Restore animations
        const animationStore = useAnimationStore.getState()
        animationStore.loadFromProject(activeAnimations)

        // Restore timeline
        const timelineStore = useTimelineStore.getState()
        timelineStore.loadFromProject(timeline)

        // Restore editor settings
        const editorStore = useEditorStore.getState()
        editorStore.setAspectRatio(project.aspect_ratio as '16:9' | '9:16' | '1:1' | '4:3' | '21:9')

        // Restore multi-character dialogue
        if (dialogueCharacters.length > 0 || dialogueLines.length > 0) {
          const multiCharacterStore = useMultiCharacterStore.getState()
          multiCharacterStore.loadFromProject({ characters: dialogueCharacters, dialogueLines })
        }

        // Restore rigs
        if (rigs && Object.keys(rigs).length > 0) {
          useRigStore.getState().loadFromProject({
            rigs,
            poseTracks: poseTracks || [],
          })

          // Cache rigs to localStorage for future orchestrator/session use.
          // Match each rig's source image to a saved character for keying.
          try {
            const { useSavedCharactersStore } = await import('./useSavedCharactersStore')
            const savedChars = useSavedCharactersStore.getState().characters
            for (const rig of Object.values(rigs)) {
              if (!rig.boneriggingSerializedData) continue
              try {
                const parsed = JSON.parse(rig.boneriggingSerializedData)
                if (!parsed.sourceImageUrl) continue
                const matchedChar = savedChars.find((sc) =>
                  sc.bodyParts?.body?.some((sprite: string) => sprite === parsed.sourceImageUrl),
                )
                if (matchedChar) {
                  cacheRigForCharacter(matchedChar.id, parsed).catch(() => {})
                }
              } catch {
                /* ignore parse errors */
              }
            }
          } catch {
            /* non-fatal */
          }
        }

        // Restore project schema
        if (projectSchema) {
          useProjectSchemaStore.getState().loadFromProject(projectSchema)
        }

        // Restore layer tree
        if (layerTree) {
          useLayerTreeStore.getState().loadFromProject(layerTree)
        }

        // Restore avatar characters
        if (avatarCharacters && avatarCharacters.length > 0) {
          useAvatarCharacterStore.getState().loadFromProject(avatarCharacters)
        }

        set((state) => {
          state.currentProjectId = id
          state.currentProjectName = project.name
          state.isLoading = false
          state.lastSaved = new Date(project.updated_at)
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load project'
        set((state) => {
          state.error = message
          state.isLoading = false
        })
        throw error
      }
    },

    saveProject: async (options?: { silent?: boolean }) => {
      const { currentProjectId, currentProjectName } = get()

      // Gather state from all stores (shared between Supabase and localStorage paths)
      const characterConfigStore = useCharacterConfigStore.getState()
      const characterPartsStore = useCharacterPartsStore.getState()
      const voiceStore = useVoiceStore.getState()
      const animationStore = useAnimationStore.getState()
      const timelineStore = useTimelineStore.getState()
      const editorStore = useEditorStore.getState()
      const multiCharacterStore = useMultiCharacterStore.getState()
      const rigStore = useRigStore.getState()

      // Convert viseme mapping (null -> 0 for storage)
      const visemeMappingForStorage: Record<string, number> = {}
      for (const [key, value] of Object.entries(characterConfigStore.visemeMapping)) {
        visemeMappingForStorage[key] = value ?? 0
      }

      const stateSnapshot = {
        sprites: characterConfigStore.savedImages,
        uploadedImages: characterConfigStore.uploadedImages,
        spriteLabels: characterConfigStore.spriteLabels,
        visemeMapping: visemeMappingForStorage,
        partTransforms: Object.fromEntries(
          Object.entries(characterPartsStore.parts).map(([key, value]) => [
            key,
            {
              position: value.position,
              rotation: value.rotation,
              scale: value.scale,
              visible: value.visible,
              selectedSpriteIndex: value.selectedSpriteIndex,
            },
          ]),
        ),
        generatedVoices: voiceStore.generatedVoices.map((v) => ({
          id: v.id,
          script: v.script,
          voiceId: v.voiceId,
          voiceName: v.voiceName,
          audioUrl: v.audioUrl,
          audioDuration: v.audioDuration,
          alignment: v.alignment as unknown as Record<string, unknown> | null,
          visemeTimeline: v.visemeTimeline as unknown as Record<string, unknown>[],
          wordTimeline: v.wordTimeline as unknown as Record<string, unknown>[],
          createdAt: new Date(v.createdAt),
        })),
        activeAnimations: (animationStore.activeAnimations ?? []).map((a) => ({
          id: a.id,
          animationId: a.animationId,
          url: animationStore.library.find((l) => l.id === a.animationId)?.url || '',
          name: animationStore.library.find((l) => l.id === a.animationId)?.name || '',
          category: (animationStore.library.find((l) => l.id === a.animationId)?.category || 'background') as
            | 'background'
            | 'overlay',
          position: a.position,
          scale: a.scale,
          opacity: a.opacity,
          zIndex: a.zIndex,
          loop: a.loop,
          speed: a.speed,
        })),
        timeline: {
          fps: timelineStore.fps,
          totalFrames: timelineStore.totalFrames,
          tracks: timelineStore.tracks.map((t) => ({
            id: t.id,
            type: t.type as 'video' | 'audio' | 'sprite',
            name: t.name,
            locked: t.locked,
            muted: t.muted,
            visible: t.visible,
            height: t.height,
            clips: t.clips.map((c) => ({
              id: c.id,
              startFrame: c.startFrame,
              endFrame: c.endFrame,
              sourceId: c.sourceId,
              sourceInPoint: c.sourceInPoint,
              sourceOutPoint: c.sourceOutPoint,
              color: c.color,
              name: c.name,
            })),
          })),
        },
        aspectRatio: editorStore.aspectRatio,
        canvasWidth: useCanvasStore.getState().canvasWidth || 1920,
        canvasHeight: useCanvasStore.getState().canvasHeight || 1080,
        // Extended character sprite data
        curvedVisemes: characterConfigStore.curvedVisemes,
        eyeVariants: characterConfigStore.eyeVariantSprites,
        eyebrowVariants: characterConfigStore.eyebrowVariantSprites,
        useCurvedVisemes: characterConfigStore.useCurvedVisemes,
        visemeTransitionMs: characterConfigStore.visemeTransitionMs,
        // Multi-character dialogue data
        dialogueCharacters: multiCharacterStore.characters,
        dialogueLines: multiCharacterStore.dialogueLines,
        // Rig data
        rigs: rigStore.rigs,
        poseTracks: rigStore.poseTracks,
        // Project schema
        projectSchema: useProjectSchemaStore.getState().exportSchema(),
        // Layer tree
        layerTree: useLayerTreeStore.getState().exportForSave(),
        // Avatar characters
        avatarCharacters: useAvatarCharacterStore.getState().characters,
        // Text overlays
        textOverlays: useTextOverlayStore.getState().overlays,
        // Shapes
        shapes: useShapeStore.getState().shapes,
        // Media canvas items
        mediaCanvasItems: useMediaStore.getState().canvasItems,
        // SVG composition
        svgComposition: useSVGObjectStore.getState().composition,
        // HTML templates
        htmlTemplates: useHTMLTemplateLayerStore.getState().templates,
        // Keyframe tracks
        keyframeTracks: useKeyframeStore.getState().tracks,
        // Camera
        cameraKeyframes: useCameraStore.getState().keyframes,
      }

      // ── localStorage fallback when Supabase is not configured ──
      if (!projectService.isAvailable()) {
        set((state) => {
          state.isSaving = true
          state.error = null
        })
        try {
          localStorage.setItem('proanimate:local-project', JSON.stringify(stateSnapshot))
          localStorage.setItem('proanimate:local-project-name', currentProjectName)
          set((state) => {
            state.isSaving = false
            state.lastSaved = new Date()
            if (!state.currentProjectId) {
              state.currentProjectId = 'local'
            }
          })
          if (!options?.silent) toast.success('Project saved', 2000)
        } catch (err) {
          console.warn('localStorage save failed:', err)
          set((state) => {
            state.isSaving = false
            state.error = 'localStorage save failed'
          })
        }
        return
      }

      if (!currentProjectId) {
        const id = await projectService.create(currentProjectName)
        set((state) => {
          state.currentProjectId = id
        })
        await get().listProjects()
      }

      set((state) => {
        state.isSaving = true
        state.error = null
      })

      try {
        const projectId = get().currentProjectId!

        // Generate thumbnail from current character state
        let thumbnailDataURL: string | null = null
        try {
          thumbnailDataURL = await generateProjectThumbnail()
        } catch (err) {
          console.warn('Thumbnail generation failed:', err)
        }

        await projectService.saveState(projectId, {
          ...stateSnapshot,
          visemeMapping: visemeMappingForStorage as Record<import('@/types/voice').Viseme, number>,
          thumbnailDataURL,
        })

        // Update project name if needed
        await projectService.update(projectId, { name: currentProjectName })

        set((state) => {
          state.isSaving = false
          state.lastSaved = new Date()
        })

        if (!options?.silent) toast.success('Project saved', 2000)

        // Refresh project list
        await get().listProjects()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save project'
        set((state) => {
          state.error = message
          state.isSaving = false
        })
        throw error
      }
    },

    deleteProject: async (id: string) => {
      if (!projectService.isAvailable()) {
        throw new Error('Supabase not configured')
      }

      try {
        await projectService.delete(id)

        // Clear current project if it was deleted
        if (get().currentProjectId === id) {
          set((state) => {
            state.currentProjectId = null
            state.currentProjectName = 'Untitled Project'
            state.lastSaved = null
          })
        }

        // Refresh project list
        await get().listProjects()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete project'
        set((state) => {
          state.error = message
        })
        throw error
      }
    },

    listProjects: async () => {
      if (!projectService.isAvailable()) {
        set((state) => {
          state.projects = []
        })
        return
      }

      try {
        const projects = await projectService.list()
        set((state) => {
          state.projects = projects
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list projects'
        set((state) => {
          state.error = message
        })
      }
    },

    renameProject: async (name: string) => {
      const { currentProjectId } = get()

      set((state) => {
        state.currentProjectName = name
      })

      if (currentProjectId && projectService.isAvailable()) {
        try {
          await projectService.update(currentProjectId, { name })
          await get().listProjects()
        } catch {
          // Ignore errors for rename - it will be saved on next full save
        }
      }
    },

    // ============================================
    // Auto-save
    // ============================================

    enableAutoSave: (intervalMs = 60000) => {
      const { autoSaveIntervalId } = get()

      // Clear existing interval
      if (autoSaveIntervalId !== null) {
        window.clearInterval(autoSaveIntervalId)
      }

      // Set up new interval
      const id = window.setInterval(async () => {
        const { currentProjectId, isSaving } = get()
        if (currentProjectId && !isSaving && projectService.isAvailable()) {
          try {
            await get().saveProject({ silent: true })
          } catch (error) {
            console.error('Auto-save failed:', error)
          }
        }
      }, intervalMs)

      set((state) => {
        state.autoSaveEnabled = true
        state.autoSaveIntervalId = id
      })
    },

    disableAutoSave: () => {
      const { autoSaveIntervalId } = get()

      if (autoSaveIntervalId !== null) {
        window.clearInterval(autoSaveIntervalId)
      }

      set((state) => {
        state.autoSaveEnabled = false
        state.autoSaveIntervalId = null
      })
    },

    // ============================================
    // Error handling
    // ============================================

    setError: (error: string | null) => {
      set((state) => {
        state.error = error
      })
    },

    clearError: () => {
      set((state) => {
        state.error = null
      })
    },
  })),
)
