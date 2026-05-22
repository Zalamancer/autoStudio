export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9'

export type CanvasOverlayId =
  | 'ai-director'
  | 'character-generator'
  | 'character-3d-import'
  | 'script-generator'
  | 'voice-generator'
  | 'dialogue-editor'
  | 'text-creator'
  | 'animation-browser'
  | 'media-browser'
  | 'video-browser'
  | 'template-browser'
  | 'svg-art-generator'
  | 'transition-picker'
  | 'caption-designer'
  | 'audio-studio'
  | 'screen-recorder'
  | 'content-calendar'
  | 'background-browser'

export type LeftPanelTopTab = 'projects' | 'settings' | 'media' | 'videos' | 'text' | 'transitions'

export type LeftPanelBottomTab =
  | 'character'
  | '3d-objects'
  | 'captions'
  | 'scripts'
  | 'dialogue'
  | 'marketplace'
  | 'video'
  | 'assets'
  | 'rig-editor'
  | 'rig-editor-3d'
  | 'export'
  | 'ai-edit'
  | 'brand-kit'
  | 'camera'
  | 'beat-sync'
  | 'style-effects'
  | 'auto-publish'
  | 'motion-capture'
  | 'motion-tracking'
  | 'virality'
  | 'repurpose'
  | 'series'
  | 'sound-effects'
  | 'smart-cut'
  | 'screen-record'
  | 'trends'
  | 'content-calendar'
  | 'live-avatar'
  | 'project-templates'
  | 'schema'
  | 'animStyle'
  | 'adaptive-music'
  | 'crowd'
  | 'wardrobe'
  | 'annotations'
  | 'memes'
  | 'branching-video'
  // | 'apps'
  | 'ai-models'
  | 'audio-reactive'
  | 'voice-clone'
  | 'transcript'
  | 'broll-suggest'
  | 'character-identity'
  | 'singing'
  | 'image-to-video'
  | 'gen-image'
  | 'gen-text-to-video'
  | 'gen-audio-to-video'
  | 'gen-video-to-video'
  | 'gen-retake'
  | 'gen-extend'
  | 'pptx-import'
  | 'mixed-media'
  | 'style-transfer'
  | 'cinema-studio'
  | 'shot-grid'
  | 'audio-browse'
  | 'audio-enhancement'
  | 'effect-browser'
  | 'competitor-scraper'
  | 'gen-manim'
  | 'motion-gallery'
  | 'ai-director'

// Combined type for the single active tab
export type LeftPanelTab = LeftPanelTopTab | LeftPanelBottomTab

export type RightPanelTab =
  | 'group-properties'
  | 'character-assets'
  | 'eye'
  | 'eyebrow'
  | 'viseme'
  | 'hair'
  | 'body'
  | 'head'
  | 'shirt'
  | 'pants'
  | 'shoes'
  | 'voices'
  | 'media-properties'
  | 'svg-object-properties'
  | 'shape-properties'
  | 'text-properties'
  | 'animation-properties'
  | 'html-template-properties'
  | '3d-character-properties'
  | 'pixelart-character-properties'
  | 'pixelart-animations'
  | 'art-curve-properties'
  | 'video-properties'
  | 'animations'
  | 'style-properties'
  | 'text-styles'
  | 'text-animations'
  | 'audio-reactive-properties'
  | 'motion-graphic-properties'
  | 'avatar-character-properties'
  | 'bundle-details'
  | 'avatar-videos'
  | 'avatar-voices'
  | 'whiteboard-background-properties'
  | 'whiteboard-bg-color'
  | 'whiteboard-bg-templates'
  | 'whiteboard-bg-texture'
  | 'whiteboard-text-properties'
  | 'whiteboard-drawing-properties'
  | 'whiteboard-stroke-properties'
  | 'camera-properties'
  | 'canvas-layers'
  | 'gen-image-properties'
  | 'gen-text-to-video-properties'
  | 'gen-audio-to-video-properties'
  | 'gen-video-to-video-properties'
  | 'gen-retake-properties'
  | 'gen-extend-properties'
  | 'image-to-video-properties'
  | 'broll-suggest-properties'
  | 'brand-kit-properties'
  | 'gen-manim-properties'
  | 'crowd-properties'
  | 'motion-gallery-styles'
  | 'ai-director-settings'
  | 'ai-director-url'
  | 'ai-director-document'
  | 'ai-director-brand'

export type TabGroupId =
  | 'ai-director'
  | 'character'
  | 'media'
  | 'audio'
  | 'edit'
  | 'script'
  | 'design'
  | 'publish'
  | 'marketplace' /* | 'apps' */

export interface SubTabDef {
  id: LeftPanelTab
  label: string
  icon?: string
  description?: string
  /** Power-user tab — hidden by default, shown via "Show advanced" toggle */
  advanced?: boolean
}

export interface TabGroupDef {
  id: TabGroupId
  label: string
  subTabs: SubTabDef[]
}

export interface EditorState {
  leftPanelCollapsed: boolean
  leftPanelTopTab: LeftPanelTopTab
  leftPanelBottomTab: LeftPanelBottomTab
  leftPanelActiveTab: LeftPanelTab // Single active tab
  leftPanelActiveGroup: TabGroupId
  leftPanelGroupMemory: Partial<Record<TabGroupId, LeftPanelTab>>
  rightPanelTab: RightPanelTab
  aspectRatio: AspectRatio
  shortcutsModalOpen: boolean
  setShortcutsModalOpen: (open: boolean) => void
  setLeftPanelGroup: (groupId: TabGroupId) => void
}
