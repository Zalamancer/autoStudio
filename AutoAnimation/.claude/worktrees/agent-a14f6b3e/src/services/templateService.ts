/**
 * Template Service — captures project snapshots, manages template CRUD,
 * and hydrates stores from template snapshots.
 */

import { supabase, dataURLtoBlob, urlToDataURL } from './supabase'
import { setByPath } from './snapshotUtils'
import type {
  ProjectTemplate,
  ProjectTemplateSnapshot,
  TemplateVariable,
  TemplateBinding,
  TemplateCategory,
  RegenerationTask,
  BindingTransform,
  SnapshotActiveAnimation,
  SnapshotGeneratedVoice,
  SnapshotCaptionSettings,
} from '@/types/projectTemplate'

// ============================================
// Store imports (lazy getState() calls)
// ============================================

import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useRigStore } from '@/stores/useRigStore'
import { useProjectStore } from '@/stores/useProjectStore'

// ============================================
// Snapshot Capture
// ============================================

/**
 * Capture a full snapshot of the current project state from all stores.
 */
export function captureSnapshot(): ProjectTemplateSnapshot {
  const characterConfig = useCharacterConfigStore.getState()
  const characterParts = useCharacterPartsStore.getState()
  const voiceStore = useVoiceStore.getState()
  const animationStore = useAnimationStore.getState()
  const timelineStore = useTimelineStore.getState()
  const editorStore = useEditorStore.getState()
  const canvasStore = useCanvasStore.getState()
  const multiCharStore = useMultiCharacterStore.getState()
  const textOverlayStore = useTextOverlayStore.getState()
  const shapeStore = useShapeStore.getState()
  const mediaStore = useMediaStore.getState()
  const videoLayerStore = useVideoLayerStore.getState()
  const htmlTemplateStore = useHTMLTemplateLayerStore.getState()
  const keyframeStore = useKeyframeStore.getState()
  const svgObjectStore = useSVGObjectStore.getState()
  const rigStore = useRigStore.getState()

  // Canvas config
  const canvas = {
    aspectRatio: editorStore.aspectRatio,
    fps: timelineStore.fps,
    canvasWidth: canvasStore.canvasWidth,
    canvasHeight: canvasStore.canvasHeight,
    totalFrames: timelineStore.totalFrames,
  }

  // Character sprites
  const visemeMappingForStorage: Record<string, number> = {}
  for (const [key, value] of Object.entries(characterConfig.visemeMapping)) {
    visemeMappingForStorage[key] = value ?? 0
  }

  const characterSprites = {
    savedImages: characterConfig.savedImages,
    uploadedImages: characterConfig.uploadedImages,
    spriteLabels: characterConfig.spriteLabels,
    visemeMapping: visemeMappingForStorage,
    partTransforms: Object.fromEntries(
      Object.entries(characterParts.parts).map(([key, value]) => [
        key,
        {
          position: value.position,
          rotation: value.rotation,
          scale: value.scale,
          visible: value.visible,
          selectedSpriteIndex: value.selectedSpriteIndex,
        },
      ])
    ),
    curvedVisemes: characterConfig.curvedVisemes as unknown as Record<string, string | null>,
    eyeVariants: characterConfig.eyeVariantSprites as unknown as Record<string, string | null>,
    eyebrowVariants: characterConfig.eyebrowVariantSprites as unknown as Record<string, string | null>,
    useCurvedVisemes: characterConfig.useCurvedVisemes,
    visemeTransitionMs: characterConfig.visemeTransitionMs,
  }

  // Dialogue
  const dialogueCharacters = multiCharStore.characters.map((c) => ({
    id: c.id,
    name: c.name,
    voiceId: c.voiceId || '',
    voiceName: '',
    savedCharacterId: c.savedCharacterId || undefined,
    color: c.color,
  }))

  const dialogueLines = multiCharStore.dialogueLines.map((l) => ({
    id: l.id,
    characterId: l.characterId,
    script: l.script,
    emotion: l.emotion,
    order: l.order,
  }))

  // Generated voices
  const generatedVoices: SnapshotGeneratedVoice[] = voiceStore.generatedVoices.map((v) => ({
    id: v.id,
    script: v.script,
    voiceId: v.voiceId,
    voiceName: v.voiceName,
    audioUrl: v.audioUrl,
    audioDuration: v.audioDuration,
    alignment: v.alignment as unknown as Record<string, unknown> | null,
    visemeTimeline: v.visemeTimeline as unknown as Record<string, unknown>[],
    wordTimeline: v.wordTimeline as unknown as Record<string, unknown>[],
  }))

  // Active animations
  const activeAnimations: SnapshotActiveAnimation[] = animationStore.activeAnimations.map((a) => {
    const lib = animationStore.library.find((l) => l.id === a.animationId)
    return {
      id: a.id,
      animationId: a.animationId,
      url: lib?.url || '',
      name: lib?.name || '',
      category: (lib?.category || 'background') as 'background' | 'overlay',
      position: a.position,
      scale: a.scale,
      opacity: a.opacity,
      zIndex: a.zIndex,
      loop: a.loop,
      speed: a.speed,
      startFrame: a.startFrame,
      endFrame: a.endFrame,
    }
  })

  // Timeline
  const timeline = {
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
  }

  // Caption settings
  let captionSettings: SnapshotCaptionSettings | null = null
  try {
    captionSettings = {
      style: voiceStore.captionStyle || 'word-by-word',
      position: voiceStore.captionPosition || 'bottom',
      fontSize: voiceStore.captionFontSize || 32,
      fontFamily: 'Inter',
      textColor: voiceStore.captionColor || '#ffffff',
      backgroundColor: '#000000',
      backgroundOpacity: voiceStore.captionBgOpacity ?? 0.7,
    }
  } catch {
    // Voice store fields may not all exist
  }

  return {
    canvas,
    characterSprites,
    dialogueCharacters,
    dialogueLines,
    generatedVoices,
    textOverlays: JSON.parse(JSON.stringify(textOverlayStore.overlays)),
    shapes: JSON.parse(JSON.stringify(shapeStore.shapes)),
    htmlTemplates: JSON.parse(JSON.stringify(htmlTemplateStore.templates)),
    svgComposition: svgObjectStore.composition
      ? JSON.parse(JSON.stringify(svgObjectStore.composition))
      : null,
    mediaAssets: mediaStore.assets.map((a) => ({ ...a })),
    mediaItems: mediaStore.canvasItems.map((c) => ({
      ...c,
      extractedColors: null,
      recoloredUrl: null,
    })),
    activeAnimations,
    videos: JSON.parse(JSON.stringify(videoLayerStore.videos)),
    keyframeTracks: JSON.parse(JSON.stringify(keyframeStore.tracks)),
    rigs: JSON.parse(JSON.stringify(rigStore.rigs)),
    poseTracks: JSON.parse(JSON.stringify(rigStore.poseTracks)),
    timeline,
    captionSettings,
  }
}

// ============================================
// Asset Upload
// ============================================

/**
 * Upload template assets (sprites, audio) to Supabase Storage bucket.
 * Replaces data URLs in the snapshot with storage URLs.
 */
export async function uploadTemplateAssets(
  templateId: string,
  snapshot: ProjectTemplateSnapshot,
): Promise<ProjectTemplateSnapshot> {
  if (!supabase) throw new Error('Supabase not configured')

  const updated = JSON.parse(JSON.stringify(snapshot)) as ProjectTemplateSnapshot

  // Upload sprite data URLs
  for (const [partType, sprites] of Object.entries(updated.characterSprites.savedImages)) {
    for (let i = 0; i < sprites.length; i++) {
      const sprite = sprites[i]
      if (sprite && sprite.startsWith('data:')) {
        const blob = dataURLtoBlob(sprite)
        const path = `${templateId}/sprites/${partType}_${i}.png`
        const { error } = await supabase.storage
          .from('project-templates')
          .upload(path, blob, { upsert: true, contentType: 'image/png' })
        if (!error) {
          const { data } = supabase.storage.from('project-templates').getPublicUrl(path)
          sprites[i] = data.publicUrl
        }
      }
    }
  }

  // Upload uploaded images (sprite sheets)
  for (const [partType, url] of Object.entries(updated.characterSprites.uploadedImages)) {
    if (url && url.startsWith('data:')) {
      const blob = dataURLtoBlob(url)
      const path = `${templateId}/sprites/${partType}_sheet.png`
      const { error } = await supabase.storage
        .from('project-templates')
        .upload(path, blob, { upsert: true, contentType: 'image/png' })
      if (!error) {
        const { data } = supabase.storage.from('project-templates').getPublicUrl(path)
        updated.characterSprites.uploadedImages[partType] = data.publicUrl
      }
    }
  }

  return updated
}

// ============================================
// Variable Application
// ============================================

/**
 * Apply user-provided variable values to a snapshot via bindings.
 * Returns the hydrated snapshot and a list of regeneration tasks
 * for transforms that require post-processing (voice regen, character swap).
 */
export function applyVariablesToSnapshot(
  snapshot: ProjectTemplateSnapshot,
  bindings: TemplateBinding[],
  values: Record<string, string | number | boolean>,
): { snapshot: ProjectTemplateSnapshot; tasks: RegenerationTask[] } {
  const hydrated = JSON.parse(JSON.stringify(snapshot)) as ProjectTemplateSnapshot
  const tasks: RegenerationTask[] = []

  const TASK_TRANSFORMS: BindingTransform[] = ['voice-regenerate', 'character-swap', 'image-upload']

  for (const binding of bindings) {
    const value = values[binding.variableKey]
    if (value === undefined) continue

    if (binding.transform === 'direct') {
      setByPath(hydrated as unknown as Record<string, unknown>, binding.snapshotPath, value)
    } else if (TASK_TRANSFORMS.includes(binding.transform)) {
      // For complex transforms, set the value and queue a regeneration task
      setByPath(hydrated as unknown as Record<string, unknown>, binding.snapshotPath, value)
      tasks.push({
        type: binding.transform as RegenerationTask['type'],
        variableKey: binding.variableKey,
        data: { path: binding.snapshotPath, value },
      })
    }
  }

  return { snapshot: hydrated, tasks }
}

// ============================================
// Store Hydration
// ============================================

/**
 * Reset all stores and populate them from a template snapshot.
 * This is the core of template instantiation.
 */
export function hydrateStoresFromSnapshot(snapshot: ProjectTemplateSnapshot): void {
  // Reset everything
  useProjectStore.getState().resetAllStores()

  const {
    canvas,
    characterSprites,
    dialogueCharacters,
    dialogueLines,
    generatedVoices,
    textOverlays,
    shapes,
    htmlTemplates,
    svgComposition,
    mediaAssets,
    mediaItems,
    activeAnimations,
    videos,
    keyframeTracks,
    rigs,
    poseTracks,
    timeline,
    captionSettings,
  } = snapshot

  // 1. Editor aspect ratio
  useEditorStore.getState().setAspectRatio(
    canvas.aspectRatio as '16:9' | '9:16' | '1:1' | '4:3' | '21:9'
  )

  // 2. Timeline (must be early — other stores read totalFrames)
  useTimelineStore.getState().loadFromProject(timeline)

  // 3. Character config
  useCharacterConfigStore.getState().loadFromProject({
    savedImages: characterSprites.savedImages as Record<string, string[]>,
    spriteLabels: characterSprites.spriteLabels as Record<string, Record<number, string>>,
    visemeMapping: characterSprites.visemeMapping as Record<string, number>,
    uploadedImages: characterSprites.uploadedImages as Record<string, string | null>,
    curvedVisemes: characterSprites.curvedVisemes as any,
    eyeVariants: characterSprites.eyeVariants as any,
    eyebrowVariants: characterSprites.eyebrowVariants as any,
    visemeTransitionMs: characterSprites.visemeTransitionMs,
  })
  if (!characterSprites.curvedVisemes) {
    useCharacterConfigStore.getState().setUseCurvedVisemes(
      characterSprites.useCurvedVisemes ?? false
    )
  }

  // 4. Character part transforms
  useCharacterPartsStore.getState().loadFromProject(characterSprites.partTransforms)

  // 5. Voices
  if (generatedVoices.length > 0) {
    useVoiceStore.getState().loadFromProject(
      generatedVoices.map((v) => ({
        ...v,
        alignment: v.alignment as unknown as Record<string, unknown> | null,
        visemeTimeline: v.visemeTimeline as Record<string, unknown>[],
        wordTimeline: v.wordTimeline as Record<string, unknown>[],
        createdAt: new Date(),
      }))
    )
  }

  // 6. Animations
  if (activeAnimations.length > 0) {
    useAnimationStore.getState().loadFromProject(
      activeAnimations.map((a) => ({
        id: a.id,
        animationId: a.animationId,
        url: a.url,
        name: a.name,
        category: a.category,
        position: a.position,
        scale: a.scale,
        opacity: a.opacity,
        zIndex: a.zIndex,
        loop: a.loop,
        speed: a.speed,
      }))
    )
  }

  // 7. Multi-character dialogue
  if (dialogueCharacters.length > 0 || dialogueLines.length > 0) {
    useMultiCharacterStore.getState().loadFromProject({
      characters: dialogueCharacters as any[],
      dialogueLines: dialogueLines as any[],
    })
  }

  // 8. Text overlays
  useTextOverlayStore.getState().loadFromSnapshot(textOverlays)

  // 9. Shapes
  useShapeStore.getState().loadFromSnapshot(shapes)

  // 10. HTML templates
  useHTMLTemplateLayerStore.getState().loadFromSnapshot(htmlTemplates)

  // 11. SVG composition
  if (svgComposition) {
    useSVGObjectStore.getState().loadFromSnapshot(svgComposition)
  }

  // 12. Media
  useMediaStore.getState().loadFromSnapshot(mediaAssets, mediaItems)

  // 13. Videos
  useVideoLayerStore.getState().loadFromSnapshot(videos)

  // 14. Keyframes
  useKeyframeStore.getState().loadFromProject(keyframeTracks)

  // 15. Rigs
  if (rigs && Object.keys(rigs).length > 0) {
    useRigStore.getState().loadFromProject({ rigs, poseTracks: poseTracks || [] })
  }

  // 16. Caption settings
  if (captionSettings) {
    const vs = useVoiceStore.getState()
    vs.setCaptionStyle(captionSettings.style as any)
    vs.setCaptionPosition(captionSettings.position as 'top' | 'center' | 'bottom')
    vs.setCaptionFontSize(captionSettings.fontSize)
    vs.setCaptionColor(captionSettings.textColor)
    vs.setCaptionBgOpacity(captionSettings.backgroundOpacity)
  }
}

// ============================================
// CRUD Operations
// ============================================

const TABLE = 'project_templates'

export async function createTemplate(data: {
  name: string
  description: string
  category: TemplateCategory
  tags: string[]
  snapshot: ProjectTemplateSnapshot
  variables: TemplateVariable[]
  bindings: TemplateBinding[]
  isPublished: boolean
  thumbnailUrl?: string | null
}): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: user } = await supabase.auth.getUser()
  if (!user?.user) throw new Error('Not authenticated')

  // Upload assets
  const templateId = crypto.randomUUID()
  const uploadedSnapshot = await uploadTemplateAssets(templateId, data.snapshot)

  const { error } = await supabase.from(TABLE).insert({
    id: templateId,
    creator_user_id: user.user.id,
    name: data.name,
    description: data.description,
    category: data.category,
    tags: data.tags,
    thumbnail_url: data.thumbnailUrl || null,
    snapshot: uploadedSnapshot,
    variables: data.variables,
    bindings: data.bindings,
    is_published: data.isPublished,
    version: 1,
    use_count: 0,
  })

  if (error) throw error
  return templateId
}

export async function getTemplate(id: string): Promise<ProjectTemplate | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return rowToTemplate(data)
}

export async function listPublished(options?: {
  category?: TemplateCategory
  search?: string
  limit?: number
  offset?: number
}): Promise<ProjectTemplate[]> {
  if (!supabase) throw new Error('Supabase not configured')

  let query = supabase
    .from(TABLE)
    .select('*')
    .eq('is_published', true)
    .order('use_count', { ascending: false })

  if (options?.category) {
    query = query.eq('category', options.category)
  }
  if (options?.search) {
    query = query.ilike('name', `%${options.search}%`)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options?.limit || 20) - 1)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []).map(rowToTemplate)
}

export async function listMyTemplates(): Promise<ProjectTemplate[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: user } = await supabase.auth.getUser()
  if (!user?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('creator_user_id', user.user.id)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data || []).map(rowToTemplate)
}

export async function updateTemplate(
  id: string,
  updates: Partial<{
    name: string
    description: string
    category: TemplateCategory
    tags: string[]
    snapshot: ProjectTemplateSnapshot
    variables: TemplateVariable[]
    bindings: TemplateBinding[]
    isPublished: boolean
    thumbnailUrl: string | null
  }>,
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const row: Record<string, unknown> = {}
  if (updates.name !== undefined) row.name = updates.name
  if (updates.description !== undefined) row.description = updates.description
  if (updates.category !== undefined) row.category = updates.category
  if (updates.tags !== undefined) row.tags = updates.tags
  if (updates.isPublished !== undefined) row.is_published = updates.isPublished
  if (updates.thumbnailUrl !== undefined) row.thumbnail_url = updates.thumbnailUrl
  if (updates.variables !== undefined) row.variables = updates.variables
  if (updates.bindings !== undefined) row.bindings = updates.bindings
  if (updates.snapshot !== undefined) {
    row.snapshot = await uploadTemplateAssets(id, updates.snapshot)
  }

  const { error } = await supabase.from(TABLE).update(row).eq('id', id)
  if (error) throw error
}

export async function deleteTemplate(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  // Delete storage files
  try {
    const { data: files } = await supabase.storage.from('project-templates').list(id)
    if (files?.length) {
      const paths = files.map((f) => `${id}/${f.name}`)
      await supabase.storage.from('project-templates').remove(paths)
    }
  } catch {
    // Non-fatal
  }

  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

/**
 * Instantiate a template: apply variables, hydrate stores, create project.
 */
export async function instantiateTemplate(
  templateId: string,
  variableValues: Record<string, string | number | boolean>,
  projectName?: string,
): Promise<{ projectId: string; tasks: RegenerationTask[] }> {
  const template = await getTemplate(templateId)
  if (!template) throw new Error('Template not found')

  // Apply variables to snapshot
  const { snapshot, tasks } = applyVariablesToSnapshot(
    template.snapshot,
    template.bindings,
    variableValues,
  )

  // Convert storage URLs back to data URLs for sprites
  const hydratedSnapshot = await hydrateStorageUrls(snapshot)

  // Hydrate all stores
  hydrateStoresFromSnapshot(hydratedSnapshot)

  // Create and save project
  const name = projectName || `${template.name} (from template)`
  const projectId = await useProjectStore.getState().createProject(name)
  await useProjectStore.getState().saveProject()

  // Increment use count (best-effort)
  if (supabase) {
    try {
      await supabase
        .from(TABLE)
        .update({ use_count: template.useCount + 1 })
        .eq('id', templateId)
    } catch {
      // Non-fatal
    }
  }

  return { projectId, tasks }
}

// ============================================
// Helpers
// ============================================

function rowToTemplate(row: Record<string, unknown>): ProjectTemplate {
  return {
    id: row.id as string,
    creatorUserId: row.creator_user_id as string,
    name: row.name as string,
    description: (row.description as string) || '',
    category: (row.category as TemplateCategory) || 'other',
    tags: (row.tags as string[]) || [],
    thumbnailUrl: (row.thumbnail_url as string) || null,
    previewVideoUrl: (row.preview_video_url as string) || null,
    snapshot: row.snapshot as ProjectTemplateSnapshot,
    variables: (row.variables as TemplateVariable[]) || [],
    bindings: (row.bindings as TemplateBinding[]) || [],
    isPublished: (row.is_published as boolean) || false,
    version: (row.version as number) || 1,
    useCount: (row.use_count as number) || 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

/**
 * Convert storage URLs in snapshot back to data URLs for local use.
 * Only converts sprite image URLs, not audio (audio plays from URL).
 */
async function hydrateStorageUrls(
  snapshot: ProjectTemplateSnapshot,
): Promise<ProjectTemplateSnapshot> {
  const hydrated = JSON.parse(JSON.stringify(snapshot)) as ProjectTemplateSnapshot

  // Convert sprite storage URLs to data URLs
  for (const [, sprites] of Object.entries(hydrated.characterSprites.savedImages)) {
    for (let i = 0; i < sprites.length; i++) {
      const url = sprites[i]
      if (url && url.startsWith('http')) {
        try {
          sprites[i] = await urlToDataURL(url)
        } catch {
          // Keep original URL if conversion fails
        }
      }
    }
  }

  return hydrated
}
