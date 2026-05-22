/**
 * NL Edit Functions — Gemini function declarations (tools) for natural language editing.
 *
 * Each function maps to a copilot action. ~30 function declarations covering
 * all timeline operations.
 */

export interface FunctionDeclaration {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, { type: string; description: string; enum?: string[] }>
    required?: string[]
  }
}

export const NL_EDIT_FUNCTIONS: FunctionDeclaration[] = [
  // Timeline operations
  {
    name: 'set_duration',
    description: 'Set the total duration of the video in seconds',
    parameters: {
      type: 'object',
      properties: {
        durationSeconds: { type: 'number', description: 'Duration in seconds' },
      },
      required: ['durationSeconds'],
    },
  },
  {
    name: 'seek_to_frame',
    description: 'Move the playhead to a specific frame number',
    parameters: {
      type: 'object',
      properties: {
        frame: { type: 'number', description: 'Frame number to seek to' },
      },
      required: ['frame'],
    },
  },
  {
    name: 'seek_to_time',
    description: 'Move the playhead to a specific time in seconds',
    parameters: {
      type: 'object',
      properties: {
        timeSec: { type: 'number', description: 'Time in seconds' },
      },
      required: ['timeSec'],
    },
  },

  // Text overlay operations
  {
    name: 'add_text_overlay',
    description: 'Add a text overlay to the canvas',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Text content' },
        presetType: { type: 'string', description: 'Preset type', enum: ['title', 'subtitle', 'lower-third', 'cta', 'quote', 'watermark'] },
        position: { type: 'string', description: 'Position', enum: ['top', 'center', 'bottom'] },
        color: { type: 'string', description: 'Text color (hex)' },
        fontSize: { type: 'number', description: 'Font size in pixels' },
      },
      required: ['content'],
    },
  },
  {
    name: 'update_text_overlay',
    description: 'Update an existing text overlay',
    parameters: {
      type: 'object',
      properties: {
        overlayId: { type: 'string', description: 'ID of the overlay to update' },
        content: { type: 'string', description: 'New text content' },
        color: { type: 'string', description: 'New color (hex)' },
        fontSize: { type: 'number', description: 'New font size' },
        position: { type: 'string', description: 'New position', enum: ['top', 'center', 'bottom'] },
      },
      required: ['overlayId'],
    },
  },
  {
    name: 'remove_text_overlay',
    description: 'Remove a text overlay by its ID',
    parameters: {
      type: 'object',
      properties: {
        overlayId: { type: 'string', description: 'ID of the overlay to remove' },
      },
      required: ['overlayId'],
    },
  },
  {
    name: 'move_text_overlay',
    description: 'Move a text overlay to a new position',
    parameters: {
      type: 'object',
      properties: {
        overlayId: { type: 'string', description: 'ID of the overlay' },
        position: { type: 'string', description: 'New position', enum: ['top', 'center', 'bottom', 'free'] },
        x: { type: 'number', description: 'X position (0-100, for free position)' },
        y: { type: 'number', description: 'Y position (0-100, for free position)' },
      },
      required: ['overlayId', 'position'],
    },
  },

  // Camera operations
  {
    name: 'add_camera_zoom',
    description: 'Add a camera zoom at a specific time or on a word',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Target: "word:TEXT" for word reference, or "frame:NUMBER" for frame' },
        zoomLevel: { type: 'number', description: 'Zoom level (1.0 = normal, 2.0 = 2x zoom)' },
        durationFrames: { type: 'number', description: 'Duration of zoom in frames' },
        easing: { type: 'string', description: 'Easing type', enum: ['linear', 'ease-in', 'ease-out', 'ease-in-out'] },
      },
      required: ['target', 'zoomLevel'],
    },
  },
  {
    name: 'add_camera_pan',
    description: 'Add a camera pan movement',
    parameters: {
      type: 'object',
      properties: {
        startFrame: { type: 'number', description: 'Start frame' },
        endFrame: { type: 'number', description: 'End frame' },
        panX: { type: 'number', description: 'Pan X offset (-100 to 100)' },
        panY: { type: 'number', description: 'Pan Y offset (-100 to 100)' },
      },
      required: ['startFrame', 'endFrame'],
    },
  },

  // Speed / pacing operations
  {
    name: 'adjust_speed',
    description: 'Change the overall pacing by adjusting timeline duration',
    parameters: {
      type: 'object',
      properties: {
        segment: { type: 'string', description: 'Segment to adjust', enum: ['intro', 'outro', 'all', 'custom'] },
        speedMultiplier: { type: 'number', description: 'Speed multiplier (0.5=half speed, 2.0=double speed)' },
        startFrame: { type: 'number', description: 'Start frame (for custom segment)' },
        endFrame: { type: 'number', description: 'End frame (for custom segment)' },
      },
      required: ['segment', 'speedMultiplier'],
    },
  },

  // Composite / multi-step operations
  {
    name: 'make_segment_faster',
    description: 'Make a segment faster (trim silence, tighten transitions)',
    parameters: {
      type: 'object',
      properties: {
        segment: { type: 'string', description: 'Which segment', enum: ['intro', 'outro', 'middle', 'all'] },
        factor: { type: 'number', description: 'Speed factor (1.5 = 50% faster)' },
      },
      required: ['segment'],
    },
  },

  // Dialogue operations
  {
    name: 'delete_dialogue_line',
    description: 'Delete a specific dialogue line',
    parameters: {
      type: 'object',
      properties: {
        lineId: { type: 'string', description: 'ID of the dialogue line to delete' },
        characterName: { type: 'string', description: 'Character name (alternative to lineId)' },
        lineIndex: { type: 'number', description: 'Line index (0-based, alternative to lineId)' },
      },
    },
  },

  // Caption operations
  {
    name: 'set_caption_style',
    description: 'Change the caption display style',
    parameters: {
      type: 'object',
      properties: {
        style: { type: 'string', description: 'Caption style', enum: ['word-by-word', 'sentence', 'karaoke'] },
        position: { type: 'string', description: 'Caption position', enum: ['top', 'center', 'bottom'] },
        fontSize: { type: 'number', description: 'Caption font size' },
        color: { type: 'string', description: 'Caption color (hex)' },
      },
    },
  },

  // Character operations
  {
    name: 'move_character',
    description: 'Move a character to a new position on the canvas',
    parameters: {
      type: 'object',
      properties: {
        characterName: { type: 'string', description: 'Character name' },
        x: { type: 'number', description: 'X position (0-100)' },
        y: { type: 'number', description: 'Y position (0-100)' },
        scale: { type: 'number', description: 'Scale factor (0.5-2.0)' },
      },
      required: ['characterName'],
    },
  },

  // Shape operations
  {
    name: 'add_shape',
    description: 'Add a geometric shape to the canvas',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Shape type', enum: ['rectangle', 'circle', 'triangle', 'star'] },
        x: { type: 'number', description: 'X position (0-100)' },
        y: { type: 'number', description: 'Y position (0-100)' },
        width: { type: 'number', description: 'Width in pixels' },
        height: { type: 'number', description: 'Height in pixels' },
        fill: { type: 'string', description: 'Fill color (hex)' },
      },
      required: ['type'],
    },
  },

  // Playback
  {
    name: 'play',
    description: 'Start playback from the current position',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'pause',
    description: 'Pause playback',
    parameters: { type: 'object', properties: {} },
  },

  // Aspect ratio
  {
    name: 'set_aspect_ratio',
    description: 'Change the canvas aspect ratio',
    parameters: {
      type: 'object',
      properties: {
        ratio: { type: 'string', description: 'Aspect ratio', enum: ['16:9', '9:16', '1:1', '4:3', '21:9'] },
      },
      required: ['ratio'],
    },
  },
]
