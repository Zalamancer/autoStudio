import type { CopilotActionType, CopilotActionSafety } from '@/types/copilot'

interface ActionDef {
  type: CopilotActionType
  safety: CopilotActionSafety
  label: string
}

export const ACTION_REGISTRY: Record<CopilotActionType, ActionDef> = {
  // Navigation — auto
  'navigate-panel': { type: 'navigate-panel', safety: 'auto', label: 'Navigate to panel' },
  'open-overlay': { type: 'open-overlay', safety: 'auto', label: 'Open overlay' },
  'close-overlay': { type: 'close-overlay', safety: 'auto', label: 'Close overlay' },

  // Playback — auto
  'play': { type: 'play', safety: 'auto', label: 'Play' },
  'pause': { type: 'pause', safety: 'auto', label: 'Pause' },
  'seek': { type: 'seek', safety: 'auto', label: 'Seek to frame' },
  'set-fps': { type: 'set-fps', safety: 'auto', label: 'Set FPS' },

  // Canvas — auto
  'set-aspect-ratio': { type: 'set-aspect-ratio', safety: 'auto', label: 'Set aspect ratio' },
  'set-zoom': { type: 'set-zoom', safety: 'auto', label: 'Set zoom' },
  'set-duration': { type: 'set-duration', safety: 'auto', label: 'Set duration' },

  // Text — confirm for add/remove, auto for update
  'add-text': { type: 'add-text', safety: 'confirm', label: 'Add text overlay' },
  'update-text': { type: 'update-text', safety: 'auto', label: 'Update text' },
  'remove-text': { type: 'remove-text', safety: 'confirm', label: 'Remove text' },

  // Shapes
  'add-shape': { type: 'add-shape', safety: 'confirm', label: 'Add shape' },
  'update-shape': { type: 'update-shape', safety: 'auto', label: 'Update shape' },
  'remove-shape': { type: 'remove-shape', safety: 'confirm', label: 'Remove shape' },

  // Characters
  'add-character': { type: 'add-character', safety: 'confirm', label: 'Add character' },
  'update-character': { type: 'update-character', safety: 'auto', label: 'Update character' },
  'remove-character': { type: 'remove-character', safety: 'confirm', label: 'Remove character' },

  // Character parts
  'update-character-part': { type: 'update-character-part', safety: 'auto', label: 'Update character part' },

  // Dialogue
  'add-dialogue': { type: 'add-dialogue', safety: 'confirm', label: 'Add dialogue line' },
  'update-dialogue': { type: 'update-dialogue', safety: 'auto', label: 'Update dialogue' },
  'remove-dialogue': { type: 'remove-dialogue', safety: 'confirm', label: 'Remove dialogue' },

  // Voice — confirm (API calls cost money)
  'generate-voice': { type: 'generate-voice', safety: 'confirm', label: 'Generate voice' },
  'generate-all-voices': { type: 'generate-all-voices', safety: 'confirm', label: 'Generate all voices' },

  // Templates
  'add-template': { type: 'add-template', safety: 'confirm', label: 'Add template' },
  'update-template-config': { type: 'update-template-config', safety: 'auto', label: 'Update template config' },
  'remove-template': { type: 'remove-template', safety: 'confirm', label: 'Remove template' },

  // SVG generation — confirm (API call)
  'generate-svg': { type: 'generate-svg', safety: 'confirm', label: 'Generate SVG illustration' },

  // Stock media — confirm (downloads from internet)
  'search-stock-image': { type: 'search-stock-image', safety: 'confirm', label: 'Search stock image' },
  'search-stock-video': { type: 'search-stock-video', safety: 'confirm', label: 'Search stock video' },
  'update-media': { type: 'update-media', safety: 'auto', label: 'Update media' },
  'remove-media': { type: 'remove-media', safety: 'confirm', label: 'Remove media' },

  // Lottie — confirm (adds to canvas)
  'add-lottie-animation': { type: 'add-lottie-animation', safety: 'confirm', label: 'Add Lottie animation' },
  'remove-lottie-animation': { type: 'remove-lottie-animation', safety: 'confirm', label: 'Remove Lottie animation' },

  // SVG objects
  'remove-svg-object': { type: 'remove-svg-object', safety: 'confirm', label: 'Remove SVG object' },
  'update-svg-object': { type: 'update-svg-object', safety: 'auto', label: 'Update SVG object' },

  // AI video — confirm (API call + generation)
  'generate-ai-video': { type: 'generate-ai-video', safety: 'confirm', label: 'Generate AI video' },
  'remove-video': { type: 'remove-video', safety: 'confirm', label: 'Remove video' },

  // Schema — auto for set, confirm for batch
  'set-schema-variable': { type: 'set-schema-variable', safety: 'auto', label: 'Set schema variable' },
  'set-schema-variable-batch': { type: 'set-schema-variable-batch', safety: 'confirm', label: 'Set multiple schema variables' },

  // Undo — auto
  'undo': { type: 'undo', safety: 'auto', label: 'Undo' },
  'redo': { type: 'redo', safety: 'auto', label: 'Redo' },

  // Batch — confirm
  'batch': { type: 'batch', safety: 'confirm', label: 'Batch actions' },
}

export function getActionSafety(type: CopilotActionType): CopilotActionSafety {
  return ACTION_REGISTRY[type]?.safety ?? 'confirm'
}

export function getActionLabel(type: CopilotActionType): string {
  return ACTION_REGISTRY[type]?.label ?? type
}
