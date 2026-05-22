import {
  supabase,
  isSupabaseConfigured,
  uploadSprite,
  uploadAudio,
  uploadThumbnail,
  deleteProjectSprites,
  deleteProjectAudio,
  urlToDataURL,
  dataURLtoBlob,
} from './supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import type {
  Project,
  ProjectListItem,
  Sprite,
  VisemeMapping,
  PartTransform,
  ActiveAnimationRow,
  TimelineClipRow,
} from '@/types/database'
import type { Viseme } from '@/types/voice'
import type { CurvedVisemeSprites } from '@/types/nanoBanana'
import type { EyeVariantSprites, EyebrowVariantSprites } from '@/types/emotionHeads'
import type { DialogueCharacter, DialogueLine } from '@/stores/useMultiCharacterStore'
import type { RigData, BonePoseTrack } from '@/types/rig'

// Re-define CharacterPartTab locally to avoid circular imports
type CharacterPartTab = 'viseme' | 'eye' | 'eyebrow' | 'hair' | 'body' | 'head' | 'shirt' | 'pants' | 'shoes'

/** All 9 part types for iteration */
const ALL_PARTS: CharacterPartTab[] = ['body', 'head', 'viseme', 'eye', 'eyebrow', 'hair', 'shirt', 'pants', 'shoes']

// ============================================
// Project CRUD Operations
// ============================================

export const projectService = {
  /**
   * Check if Supabase is available
   */
  isAvailable(): boolean {
    return isSupabaseConfigured() && supabase !== null
  },

  /**
   * Create a new project
   */
  async create(name: string = 'Untitled Project'): Promise<string> {
    if (!supabase) throw new Error('Supabase not configured')

    const userId = useAuthStore.getState().user?.id

    // Try with user_id first (if authenticated and auth migration has been applied)
    if (userId) {
      const { data, error } = await supabase
        .from('projects')
        .insert({ name, user_id: userId } as Record<string, unknown>)
        .select('id')
        .single()

      if (!error) return data.id

      // If error is about missing user_id column, fall through to insert without it
      const isSchemaError = error.message?.includes('schema cache')
        || error.message?.includes('user_id')
        || error.code === 'PGRST204'
      if (!isSchemaError) throw error

      console.warn('[projectService] user_id column not found, inserting without it (auth migration not applied)')
    }

    // Insert without user_id (pre-auth or migration not applied)
    const { data, error } = await supabase
      .from('projects')
      .insert({ name })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  },

  /**
   * Get project by ID
   */
  async getById(id: string): Promise<Project | null> {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  },

  /**
   * Update project metadata
   */
  async update(id: string, updates: Partial<Omit<Project, 'id' | 'created_at'>>): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured')

    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Delete a project and all related data
   */
  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured')

    // Delete storage files first
    await deleteProjectSprites(id)
    await deleteProjectAudio(id)

    // Delete from database (cascades to related tables)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * List all projects
   */
  async list(): Promise<ProjectListItem[]> {
    if (!supabase) throw new Error('Supabase not configured')

    // Query all projects the user has access to.
    // If auth migration is applied, RLS filters by user_id automatically.
    // If not, all projects are returned (pre-auth behavior).
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, thumbnail, updated_at, created_at')
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // ============================================
  // Save Full Project State
  // ============================================

  /**
   * Save complete project state from Zustand stores
   */
  async saveState(
    projectId: string,
    state: {
      // From useCharacterConfigStore
      sprites: Record<CharacterPartTab, string[]>
      uploadedImages: Record<CharacterPartTab, string | null>
      spriteLabels: Record<CharacterPartTab, Record<number, string>>
      visemeMapping: Partial<Record<Viseme, number>>

      // From useCharacterPartsStore
      partTransforms: Record<
        string,
        {
          position: { x: number; y: number }
          rotation: number
          scale: { x: number; y: number }
          visible: boolean
          selectedSpriteIndex: number
        }
      >

      // From useVoiceStore
      generatedVoices: Array<{
        id: string
        script: string
        voiceId: string
        voiceName: string
        audioUrl: string
        audioDuration: number
        alignment: Record<string, unknown> | null
        visemeTimeline: Record<string, unknown>[]
        wordTimeline: Record<string, unknown>[]
        createdAt: Date
      }>

      // From useAnimationStore
      activeAnimations: Array<{
        id: string
        animationId: string
        url: string
        name: string
        category: 'background' | 'overlay'
        position: { x: number; y: number }
        scale: number
        opacity: number
        zIndex: number
        loop: boolean
        speed: number
      }>

      // From useTimelineStore
      timeline: {
        fps: number
        totalFrames: number
        tracks: Array<{
          id: string
          type: 'video' | 'audio' | 'sprite'
          name?: string
          locked: boolean
          muted: boolean
          visible: boolean
          height: number
          clips: Array<{
            id: string
            startFrame: number
            endFrame: number
            sourceId?: string
            sourceInPoint: number
            sourceOutPoint: number
            color?: string
            name?: string
          }>
        }>
      }

      // From useEditorStore
      aspectRatio?: string
      canvasWidth?: number
      canvasHeight?: number

      // Thumbnail
      thumbnailDataURL?: string | null

      // From useCharacterConfigStore — extended sprite data
      curvedVisemes?: CurvedVisemeSprites
      eyeVariants?: EyeVariantSprites
      eyebrowVariants?: EyebrowVariantSprites
      useCurvedVisemes?: boolean
      visemeTransitionMs?: number

      // From useMultiCharacterStore
      dialogueCharacters?: DialogueCharacter[]
      dialogueLines?: DialogueLine[]

      // From useRigStore
      rigs?: Record<string, RigData>
      poseTracks?: BonePoseTrack[]
      // From useProjectSchemaStore
      projectSchema?: import('@/types/projectSchema').ProjectSchema | null
      // From useLayerTreeStore
      layerTree?: import('@/types/layerTree').LayerTreeSaveData | null
      // From useAvatarCharacterStore
      avatarCharacters?: import('@/types/avatar').AvatarCharacter[]
    }
  ): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured')

    // 1. Update project metadata
    const projectUpdates: Partial<Omit<Project, 'id' | 'created_at'>> = {
      fps: state.timeline.fps,
      duration_frames: state.timeline.totalFrames,
      aspect_ratio: state.aspectRatio || '16:9',
      canvas_width: state.canvasWidth || 1920,
      canvas_height: state.canvasHeight || 1080,
    }

    // 1b. Upload thumbnail if provided
    if (state.thumbnailDataURL) {
      try {
        const blob = dataURLtoBlob(state.thumbnailDataURL)
        const thumbnailUrl = await uploadThumbnail(projectId, blob)
        projectUpdates.thumbnail = thumbnailUrl
      } catch (err) {
        // Thumbnail upload failure should not block the save
        console.warn('Failed to upload thumbnail:', err)
      }
    }

    await this.update(projectId, projectUpdates)

    // 2. Delete existing related data
    await Promise.all([
      supabase.from('sprites').delete().eq('project_id', projectId),
      supabase.from('viseme_mappings').delete().eq('project_id', projectId),
      supabase.from('part_transforms').delete().eq('project_id', projectId),
      supabase.from('generated_voices').delete().eq('project_id', projectId),
      supabase.from('active_animations').delete().eq('project_id', projectId),
      supabase.from('timeline_tracks').delete().eq('project_id', projectId),
    ])

    // 3. Upload sprites and save to database
    const spritesToInsert: Omit<Sprite, 'id' | 'created_at'>[] = []
    const partTypes: CharacterPartTab[] = ALL_PARTS

    for (const partType of partTypes) {
      const images = state.sprites[partType] || []
      for (let i = 0; i < images.length; i++) {
        const dataURL = images[i]
        if (!dataURL) continue

        // Upload to storage
        const imageUrl = await uploadSprite(projectId, dataURL, partType, i)

        spritesToInsert.push({
          project_id: projectId,
          part_type: partType,
          label: state.spriteLabels[partType]?.[i] || null,
          image_url: imageUrl,
          sort_order: i,
        })
      }

      // Also upload the uploaded image (sprite sheet) for this part type
      const uploadedImage = state.uploadedImages[partType]
      if (uploadedImage) {
        const sheetUrl = await uploadSprite(projectId, uploadedImage, `${partType}_sheet`, 0)
        spritesToInsert.push({
          project_id: projectId,
          part_type: `${partType}_sheet`, // Special marker for sprite sheets
          label: 'Sprite Sheet',
          image_url: sheetUrl,
          sort_order: -1, // Use -1 to identify sheet vs individual sprites
        })
      }
    }

    if (spritesToInsert.length > 0) {
      const { error } = await supabase.from('sprites').insert(spritesToInsert)
      if (error) throw error
    }

    // 3b. Upload curved visemes (24-sprite emotion-aware lip sync)
    if (state.curvedVisemes) {
      const curvedSpritesToInsert: Omit<Sprite, 'id' | 'created_at'>[] = []
      let curvedIndex = 0
      for (const [key, dataURL] of Object.entries(state.curvedVisemes)) {
        if (!dataURL) continue
        const imageUrl = await uploadSprite(projectId, dataURL, `curved_viseme_${key}`, 0)
        curvedSpritesToInsert.push({
          project_id: projectId,
          part_type: `curved_viseme_${key}`,
          label: key,
          image_url: imageUrl,
          sort_order: curvedIndex++,
        })
      }
      if (curvedSpritesToInsert.length > 0) {
        const { error } = await supabase.from('sprites').insert(curvedSpritesToInsert)
        if (error) throw error
      }
    }

    // 3c. Upload eye variant sprites (6 variants)
    if (state.eyeVariants) {
      const eyeSpritesToInsert: Omit<Sprite, 'id' | 'created_at'>[] = []
      let eyeIndex = 0
      for (const [key, dataURL] of Object.entries(state.eyeVariants)) {
        if (!dataURL) continue
        const imageUrl = await uploadSprite(projectId, dataURL, `eye_variant_${key}`, 0)
        eyeSpritesToInsert.push({
          project_id: projectId,
          part_type: `eye_variant_${key}`,
          label: key,
          image_url: imageUrl,
          sort_order: eyeIndex++,
        })
      }
      if (eyeSpritesToInsert.length > 0) {
        const { error } = await supabase.from('sprites').insert(eyeSpritesToInsert)
        if (error) throw error
      }
    }

    // 3c2. Upload eyebrow variant sprites (6 variants)
    if (state.eyebrowVariants) {
      const eyebrowSpritesToInsert: Omit<Sprite, 'id' | 'created_at'>[] = []
      let eyebrowIndex = 0
      for (const [key, dataURL] of Object.entries(state.eyebrowVariants)) {
        if (!dataURL) continue
        const imageUrl = await uploadSprite(projectId, dataURL, `eyebrow_variant_${key}`, 0)
        eyebrowSpritesToInsert.push({
          project_id: projectId,
          part_type: `eyebrow_variant_${key}`,
          label: key,
          image_url: imageUrl,
          sort_order: eyebrowIndex++,
        })
      }
      if (eyebrowSpritesToInsert.length > 0) {
        const { error } = await supabase.from('sprites').insert(eyebrowSpritesToInsert)
        if (error) throw error
      }
    }

    // 3d. Save character config metadata (non-image settings)
    const configMetadata: Record<string, unknown> = {}
    if (state.useCurvedVisemes !== undefined) configMetadata.useCurvedVisemes = state.useCurvedVisemes
    if (state.visemeTransitionMs !== undefined) configMetadata.visemeTransitionMs = state.visemeTransitionMs
    if (Object.keys(configMetadata).length > 0) {
      const { error } = await supabase.from('sprites').insert({
        project_id: projectId,
        part_type: '_config_metadata',
        label: 'Config Metadata',
        image_url: JSON.stringify(configMetadata),
        sort_order: -99,
      })
      if (error) throw error
    }

    // 3e. Save multi-character dialogue data
    if (state.dialogueCharacters && state.dialogueCharacters.length > 0) {
      const { error } = await supabase.from('sprites').insert({
        project_id: projectId,
        part_type: '_dialogue_characters',
        label: 'Dialogue Characters',
        image_url: JSON.stringify(state.dialogueCharacters),
        sort_order: -98,
      })
      if (error) throw error
    }
    if (state.dialogueLines && state.dialogueLines.length > 0) {
      const { error } = await supabase.from('sprites').insert({
        project_id: projectId,
        part_type: '_dialogue_lines',
        label: 'Dialogue Lines',
        image_url: JSON.stringify(state.dialogueLines),
        sort_order: -97,
      })
      if (error) throw error
    }

    // 3f. Save rig data (rigs + pose tracks)
    if (state.rigs && Object.keys(state.rigs).length > 0) {
      const { error } = await supabase.from('sprites').insert({
        project_id: projectId,
        part_type: '_rig_data',
        label: 'Rig Data',
        image_url: JSON.stringify({ rigs: state.rigs, poseTracks: state.poseTracks || [] }),
        sort_order: -96,
      })
      if (error) throw error
    }

    // 3g. Save project schema
    if (state.projectSchema) {
      const { error } = await supabase.from('sprites').insert({
        project_id: projectId,
        part_type: '_project_schema',
        label: 'Project Schema',
        image_url: JSON.stringify(state.projectSchema),
        sort_order: -95,
      })
      if (error) throw error
    }

    // 3h. Save layer tree
    if (state.layerTree && (state.layerTree.groups.length > 0 || Object.keys(state.layerTree.assignments).length > 0)) {
      const { error } = await supabase.from('sprites').insert({
        project_id: projectId,
        part_type: '_layer_tree',
        label: 'Layer Tree',
        image_url: JSON.stringify(state.layerTree),
        sort_order: -94,
      })
      if (error) throw error
    }

    // 3i. Save avatar characters
    if (state.avatarCharacters && state.avatarCharacters.length > 0) {
      const { error } = await supabase.from('sprites').insert({
        project_id: projectId,
        part_type: '_avatar_characters',
        label: 'Avatar Characters',
        image_url: JSON.stringify(state.avatarCharacters),
        sort_order: -93,
      })
      if (error) throw error
    }

    // 4. Save viseme mappings
    const visemeMappings: Omit<VisemeMapping, 'id'>[] = Object.entries(
      state.visemeMapping
    ).map(([visemeType, spriteIndex]) => ({
      project_id: projectId,
      viseme_type: visemeType as VisemeMapping['viseme_type'],
      sprite_index: spriteIndex as number,
    }))

    if (visemeMappings.length > 0) {
      const { error } = await supabase.from('viseme_mappings').insert(visemeMappings)
      if (error) throw error
    }

    // 5. Save part transforms
    const partTransforms: Omit<PartTransform, 'id'>[] = Object.entries(
      state.partTransforms
    ).map(([partType, transform]) => ({
      project_id: projectId,
      part_type: partType,
      position_x: transform.position.x,
      position_y: transform.position.y,
      rotation: transform.rotation,
      scale_x: transform.scale.x,
      scale_y: transform.scale.y,
      visible: transform.visible,
      selected_sprite_index: transform.selectedSpriteIndex,
    }))

    if (partTransforms.length > 0) {
      const { error } = await supabase.from('part_transforms').insert(partTransforms)
      if (error) throw error
    }

    // 6. Save generated voices (upload audio to storage)
    for (const voice of state.generatedVoices) {
      let audioStorageUrl: string | null = null

      if (voice.audioUrl && voice.audioUrl.startsWith('blob:')) {
        // Convert blob URL to actual blob and upload
        const response = await fetch(voice.audioUrl)
        const blob = await response.blob()
        audioStorageUrl = await uploadAudio(projectId, blob, voice.id)
      } else if (voice.audioUrl) {
        audioStorageUrl = voice.audioUrl
      }

      const { error } = await supabase.from('generated_voices').insert({
        project_id: projectId,
        script: voice.script,
        voice_id: voice.voiceId,
        voice_name: voice.voiceName,
        audio_url: audioStorageUrl,
        audio_duration: voice.audioDuration,
        alignment_data: voice.alignment,
        viseme_timeline: voice.visemeTimeline,
        word_timeline: voice.wordTimeline,
      })
      if (error) throw error
    }

    // 7. Save active animations
    const activeAnimations: Omit<ActiveAnimationRow, 'id'>[] = state.activeAnimations.map(
      (anim) => ({
        project_id: projectId,
        animation_url: anim.url,
        animation_name: anim.name,
        category: anim.category,
        position_x: anim.position.x,
        position_y: anim.position.y,
        scale: anim.scale,
        opacity: anim.opacity,
        z_index: anim.zIndex,
        loop: anim.loop,
        speed: anim.speed,
      })
    )

    if (activeAnimations.length > 0) {
      const { error } = await supabase.from('active_animations').insert(activeAnimations)
      if (error) throw error
    }

    // 8. Save timeline tracks and clips
    for (let i = 0; i < state.timeline.tracks.length; i++) {
      const track = state.timeline.tracks[i]

      const { data: trackData, error: trackError } = await supabase
        .from('timeline_tracks')
        .insert({
          project_id: projectId,
          track_type: track.type,
          name: track.name || null,
          locked: track.locked,
          muted: track.muted,
          visible: track.visible,
          height: track.height,
          sort_order: i,
        })
        .select('id')
        .single()

      if (trackError) throw trackError

      // Insert clips for this track
      if (track.clips.length > 0) {
        const clips: Omit<TimelineClipRow, 'id'>[] = track.clips.map((clip) => ({
          track_id: trackData.id,
          start_frame: clip.startFrame,
          end_frame: clip.endFrame,
          source_id: clip.sourceId || null,
          source_in_point: clip.sourceInPoint,
          source_out_point: clip.sourceOutPoint,
          color: clip.color || null,
          name: clip.name || null,
        }))

        const { error: clipsError } = await supabase.from('timeline_clips').insert(clips)
        if (clipsError) throw clipsError
      }
    }
  },

  // ============================================
  // Load Full Project State
  // ============================================

  /**
   * Load complete project state to restore into Zustand stores
   */
  async loadState(projectId: string): Promise<{
    project: Project
    sprites: Record<CharacterPartTab, string[]>
    uploadedImages: Record<CharacterPartTab, string | null>
    spriteLabels: Record<CharacterPartTab, Record<number, string>>
    visemeMapping: Partial<Record<Viseme, number>>
    partTransforms: Record<
      string,
      {
        position: { x: number; y: number }
        rotation: number
        scale: { x: number; y: number }
        visible: boolean
        selectedSpriteIndex: number
      }
    >
    generatedVoices: Array<{
      id: string
      script: string
      voiceId: string
      voiceName: string
      audioUrl: string
      audioDuration: number
      alignment: Record<string, unknown> | null
      visemeTimeline: Record<string, unknown>[]
      wordTimeline: Record<string, unknown>[]
      createdAt: Date
    }>
    activeAnimations: Array<{
      id: string
      animationId: string
      url: string
      name: string
      category: 'background' | 'overlay'
      position: { x: number; y: number }
      scale: number
      opacity: number
      zIndex: number
      loop: boolean
      speed: number
    }>
    timeline: {
      fps: number
      totalFrames: number
      tracks: Array<{
        id: string
        type: 'video' | 'audio' | 'sprite'
        name?: string
        locked: boolean
        muted: boolean
        visible: boolean
        height: number
        clips: Array<{
          id: string
          startFrame: number
          endFrame: number
          sourceId?: string
          sourceInPoint: number
          sourceOutPoint: number
          color?: string
          name?: string
        }>
      }>
    }
    // Extended character data
    curvedVisemes: CurvedVisemeSprites | null
    eyeVariants: EyeVariantSprites | null
    eyebrowVariants: EyebrowVariantSprites | null
    useCurvedVisemes: boolean
    visemeTransitionMs: number
    // Multi-character dialogue
    dialogueCharacters: DialogueCharacter[]
    dialogueLines: DialogueLine[]
    // Rigs
    rigs: Record<string, RigData>
    poseTracks: BonePoseTrack[]
    // Project schema
    projectSchema: import('@/types/projectSchema').ProjectSchema | null
    // Layer tree
    layerTree: import('@/types/layerTree').LayerTreeSaveData | null
    // Avatar characters
    avatarCharacters: import('@/types/avatar').AvatarCharacter[]
  } | null> {
    if (!supabase) throw new Error('Supabase not configured')

    // 1. Load project
    const project = await this.getById(projectId)
    if (!project) return null

    // 2. Load all related data in parallel
    const [
      spritesResult,
      visemeMappingsResult,
      partTransformsResult,
      generatedVoicesResult,
      activeAnimationsResult,
      timelineTracksResult,
    ] = await Promise.all([
      supabase
        .from('sprites')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order'),
      supabase.from('viseme_mappings').select('*').eq('project_id', projectId),
      supabase.from('part_transforms').select('*').eq('project_id', projectId),
      supabase
        .from('generated_voices')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at'),
      supabase.from('active_animations').select('*').eq('project_id', projectId),
      supabase
        .from('timeline_tracks')
        .select('*, timeline_clips(*)')
        .eq('project_id', projectId)
        .order('sort_order'),
    ])

    // 3. Process sprites - download and convert to data URLs
    const sprites: Record<CharacterPartTab, string[]> = {
      body: [], head: [], viseme: [], eye: [], eyebrow: [], hair: [], shirt: [], pants: [], shoes: [],
    }
    const spriteLabels: Record<CharacterPartTab, Record<number, string>> = {
      body: {}, head: {}, viseme: {}, eye: {}, eyebrow: {}, hair: {}, shirt: {}, pants: {}, shoes: {},
    }
    const uploadedImages: Record<CharacterPartTab, string | null> = {
      body: null, head: null, viseme: null, eye: null, eyebrow: null, hair: null, shirt: null, pants: null, shoes: null,
    }

    // Extended character data containers
    const curvedVisemes: Record<string, string | null> = {}
    const eyeVariants: Record<string, string | null> = {}
    const eyebrowVariants: Record<string, string | null> = {}
    let configMetadata: Record<string, unknown> = {}
    let dialogueCharacters: DialogueCharacter[] = []
    let dialogueLines: DialogueLine[] = []
    let rigData: { rigs: Record<string, RigData>; poseTracks: BonePoseTrack[] } | null = null
    let projectSchema: import('@/types/projectSchema').ProjectSchema | null = null
    let layerTree: import('@/types/layerTree').LayerTreeSaveData | null = null
    let avatarCharacters: import('@/types/avatar').AvatarCharacter[] = []
    let hasCurvedVisemeData = false
    let hasEyeVariantData = false
    let hasEyebrowVariantData = false

    if (spritesResult.data) {
      for (const sprite of spritesResult.data) {
        const partType = sprite.part_type as string

        // Check if this is a sprite sheet (sort_order = -1 and ends with _sheet)
        if (sprite.sort_order === -1 && partType.endsWith('_sheet')) {
          const basePartType = partType.replace('_sheet', '') as string
          if ((ALL_PARTS as string[]).includes(basePartType)) {
            const dataURL = await urlToDataURL(sprite.image_url)
            uploadedImages[basePartType as CharacterPartTab] = dataURL
          } else if (basePartType === 'head') {
            // 'head_sheet' is now a real part sheet
            const dataURL = await urlToDataURL(sprite.image_url)
            uploadedImages.head = dataURL
          }
        } else if (partType.startsWith('curved_viseme_')) {
          // Curved viseme sprite (e.g. curved_viseme_upward_REST)
          const key = partType.replace('curved_viseme_', '')
          const dataURL = await urlToDataURL(sprite.image_url)
          curvedVisemes[key] = dataURL
          hasCurvedVisemeData = true
        } else if (partType.startsWith('eye_variant_')) {
          // Eye variant sprite (e.g. eye_variant_happy)
          const key = partType.replace('eye_variant_', '')
          const dataURL = await urlToDataURL(sprite.image_url)
          eyeVariants[key] = dataURL
          hasEyeVariantData = true
        } else if (partType.startsWith('eyebrow_variant_')) {
          // Eyebrow variant sprite (e.g. eyebrow_variant_angry)
          const key = partType.replace('eyebrow_variant_', '')
          const dataURL = await urlToDataURL(sprite.image_url)
          eyebrowVariants[key] = dataURL
          hasEyebrowVariantData = true
        } else if (partType.startsWith('emotion_head_')) {
          // Legacy: old emotion head sprite — map to eye + eyebrow variants for backwards compat
          // e.g. emotion_head_Joy_1 → eye: happy, eyebrow: happy
          // We just load them so they're not lost, but the new system uses eye/eyebrow variants
          const dataURL = await urlToDataURL(sprite.image_url)
          // Store under eye variant as a best-effort migration
          const key = partType.replace('emotion_head_', '')
          // Map legacy emotion head keys to eye/eyebrow variants
          const emotionToVariant: Record<string, string> = {
            'Joy_1': 'happy', 'Joy_2': 'happy', 'Joy_3': 'happy', 'Joy_4': 'happy',
            'Anger_1': 'angry', 'Anger_2': 'angry', 'Anger_3': 'angry', 'Anger_4': 'angry',
            'Sadness_1': 'sad', 'Sadness_2': 'sad', 'Sadness_3': 'sad', 'Sadness_4': 'sad',
            'Surprise_1': 'shocked', 'Surprise_2': 'shocked', 'Surprise_3': 'shocked', 'Surprise_4': 'shocked',
            'Disgust_1': 'suspicious', 'Disgust_2': 'suspicious', 'Disgust_3': 'suspicious', 'Disgust_4': 'suspicious',
            'Fear_1': 'suspicious', 'Fear_2': 'suspicious', 'Fear_3': 'suspicious', 'Fear_4': 'suspicious',
          }
          const variant = emotionToVariant[key]
          if (variant && !eyeVariants[variant]) {
            eyeVariants[variant] = dataURL
            hasEyeVariantData = true
          }
          if (variant && !eyebrowVariants[variant]) {
            eyebrowVariants[variant] = dataURL
            hasEyebrowVariantData = true
          }
        } else if (partType === '_config_metadata') {
          // Character config metadata (JSON)
          try {
            configMetadata = JSON.parse(sprite.image_url)
          } catch (e) { console.warn('[projectService] Failed to parse _config_metadata:', e) }
        } else if (partType === '_dialogue_characters') {
          // Multi-character dialogue characters (JSON)
          try {
            dialogueCharacters = JSON.parse(sprite.image_url)
          } catch (e) { console.warn('[projectService] Failed to parse _dialogue_characters:', e) }
        } else if (partType === '_dialogue_lines') {
          // Multi-character dialogue lines (JSON)
          try {
            dialogueLines = JSON.parse(sprite.image_url)
          } catch (e) { console.warn('[projectService] Failed to parse _dialogue_lines:', e) }
        } else if (partType === '_rig_data') {
          // Rig data (rigs + pose tracks)
          try {
            const parsed = JSON.parse(sprite.image_url) as { rigs: Record<string, RigData>; poseTracks: BonePoseTrack[] }
            rigData = parsed
          } catch (e) { console.warn('[projectService] Failed to parse _rig_data:', e) }
        } else if (partType === '_project_schema') {
          // Project schema (variables + bindings)
          try {
            projectSchema = JSON.parse(sprite.image_url)
          } catch (e) { console.warn('[projectService] Failed to parse _project_schema:', e) }
        } else if (partType === '_layer_tree') {
          // Layer tree (groups + assignments + order)
          try {
            layerTree = JSON.parse(sprite.image_url)
          } catch (e) { console.warn('[projectService] Failed to parse _layer_tree:', e) }
        } else if (partType === '_avatar_characters') {
          // Avatar characters on canvas (JSON)
          try {
            avatarCharacters = JSON.parse(sprite.image_url)
          } catch (e) { console.warn('[projectService] Failed to parse _avatar_characters:', e) }
        } else if ((ALL_PARTS as string[]).includes(partType)) {
          // Regular sprite (one of the 8 part types)
          const dataURL = await urlToDataURL(sprite.image_url)
          sprites[partType as CharacterPartTab][sprite.sort_order] = dataURL
          if (sprite.label && sprite.label !== 'Sprite Sheet') {
            spriteLabels[partType as CharacterPartTab][sprite.sort_order] = sprite.label
          }
        } else if (partType === 'head') {
          // 'head' is now a real part — load it directly
          const dataURL = await urlToDataURL(sprite.image_url)
          sprites.head[sprite.sort_order] = dataURL
          if (sprite.label && sprite.label !== 'Sprite Sheet') {
            spriteLabels.head[sprite.sort_order] = sprite.label
          }
        }
      }
    }

    // 4. Process viseme mappings
    const visemeMapping: Partial<Record<Viseme, number>> = {
      Rest: 0,
      Aa: 1,
      Ee: 2,
      Oh: 3,
      Oo: 4,
      FV: 5,
      MBP: 6,
      DTL: 7,
      ChR: 8,
    }

    if (visemeMappingsResult.data) {
      for (const mapping of visemeMappingsResult.data) {
        visemeMapping[mapping.viseme_type as Viseme] = mapping.sprite_index
      }
    }

    // 5. Process part transforms
    const partTransforms: Record<
      string,
      {
        position: { x: number; y: number }
        rotation: number
        scale: { x: number; y: number }
        visible: boolean
        selectedSpriteIndex: number
      }
    > = {}

    if (partTransformsResult.data) {
      for (const pt of partTransformsResult.data) {
        partTransforms[pt.part_type] = {
          position: { x: pt.position_x, y: pt.position_y },
          rotation: pt.rotation,
          scale: { x: pt.scale_x, y: pt.scale_y },
          visible: pt.visible,
          selectedSpriteIndex: pt.selected_sprite_index,
        }
      }
    }

    // 6. Process generated voices
    const generatedVoices =
      generatedVoicesResult.data?.map((v) => ({
        id: v.id,
        script: v.script,
        voiceId: v.voice_id || '',
        voiceName: v.voice_name || '',
        audioUrl: v.audio_url || '',
        audioDuration: v.audio_duration || 0,
        alignment: v.alignment_data,
        visemeTimeline: (v.viseme_timeline || []) as Record<string, unknown>[],
        wordTimeline: (v.word_timeline || []) as Record<string, unknown>[],
        createdAt: new Date(v.created_at),
      })) || []

    // 7. Process active animations
    const activeAnimations =
      activeAnimationsResult.data?.map((a) => ({
        id: a.id,
        animationId: a.id,
        url: a.animation_url,
        name: a.animation_name || '',
        category: a.category || ('background' as const),
        position: { x: a.position_x, y: a.position_y },
        scale: a.scale,
        opacity: a.opacity,
        zIndex: a.z_index,
        loop: a.loop,
        speed: a.speed,
      })) || []

    // 8. Process timeline
    const tracks =
      timelineTracksResult.data?.map((t) => ({
        id: t.id,
        type: t.track_type as 'video' | 'audio' | 'sprite',
        name: t.name || undefined,
        locked: t.locked,
        muted: t.muted,
        visible: t.visible,
        height: t.height,
        clips: ((t as unknown as { timeline_clips: TimelineClipRow[] }).timeline_clips || []).map(
          (c: TimelineClipRow) => ({
            id: c.id,
            startFrame: c.start_frame,
            endFrame: c.end_frame,
            sourceId: c.source_id || undefined,
            sourceInPoint: c.source_in_point,
            sourceOutPoint: c.source_out_point || 0,
            color: c.color || undefined,
            name: c.name || undefined,
          })
        ),
      })) || []

    return {
      project,
      sprites,
      uploadedImages,
      spriteLabels,
      visemeMapping,
      partTransforms,
      generatedVoices,
      activeAnimations,
      timeline: {
        fps: project.fps,
        totalFrames: project.duration_frames,
        tracks,
      },
      // Extended character data
      curvedVisemes: hasCurvedVisemeData ? (curvedVisemes as CurvedVisemeSprites) : null,
      eyeVariants: hasEyeVariantData ? (eyeVariants as EyeVariantSprites) : null,
      eyebrowVariants: hasEyebrowVariantData ? (eyebrowVariants as EyebrowVariantSprites) : null,
      useCurvedVisemes: (configMetadata.useCurvedVisemes as boolean) ?? false,
      visemeTransitionMs: (configMetadata.visemeTransitionMs as number) ?? 60,
      // Multi-character dialogue
      dialogueCharacters,
      dialogueLines,
      // Rigs
      rigs: rigData?.rigs ?? {},
      poseTracks: rigData?.poseTracks ?? [],
      // Project schema
      projectSchema,
      // Layer tree
      layerTree,
      // Avatar characters
      avatarCharacters,
    }
  },
}
