import type { SchemaVariable, SchemaBinding } from '@/types/projectSchema'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useTimelineStore } from '@/stores/useTimelineStore'

interface DetectedPair {
  variable: SchemaVariable
  bindings: SchemaBinding[]
}

function isColorValue(v: string): boolean {
  if (/^#([0-9a-fA-F]{3,8})$/.test(v)) return true
  if (/^rgba?\(/.test(v)) return true
  return false
}

let orderCounter = 0

function makeVar(
  key: string,
  label: string,
  type: SchemaVariable['type'],
  value: unknown,
  group: string,
  description?: string,
  tags?: string[],
): SchemaVariable {
  return {
    key,
    label,
    type,
    value,
    defaultValue: value,
    group,
    order: orderCounter++,
    source: 'auto',
    description,
    tags,
  }
}

/**
 * Scan live stores and propose SchemaVariable + SchemaBinding pairs.
 * Pattern from templateConfigParser.ts type inference.
 */
export function detectSchemaVariables(): DetectedPair[] {
  orderCounter = 0
  const results: DetectedPair[] = []

  // Text overlays
  const overlays = useTextOverlayStore.getState().overlays
  for (const overlay of overlays) {
    const prefix = `text_${overlay.id.slice(0, 6)}`
    // Content
    results.push({
      variable: makeVar(
        `${prefix}_content`,
        `${overlay.presetType} text`,
        'text',
        overlay.content,
        'Text',
        `Text content for ${overlay.presetType} overlay`,
        ['text', overlay.presetType],
      ),
      bindings: [{
        variableKey: `${prefix}_content`,
        mode: 'store-action',
        targetStore: 'text-overlay',
        entityId: overlay.id,
        property: 'content',
        transform: 'direct',
      }],
    })
    // Color
    results.push({
      variable: makeVar(`${prefix}_color`, `${overlay.presetType} color`, 'color', overlay.color, 'Colors'),
      bindings: [{
        variableKey: `${prefix}_color`,
        mode: 'store-action',
        targetStore: 'text-overlay',
        entityId: overlay.id,
        property: 'color',
        transform: 'direct',
      }],
    })
    // Font size
    results.push({
      variable: makeVar(
        `${prefix}_fontSize`,
        `${overlay.presetType} font size`,
        'number',
        overlay.fontSize,
        'Text',
        undefined,
        ['text', 'size'],
      ),
      bindings: [{
        variableKey: `${prefix}_fontSize`,
        mode: 'store-action',
        targetStore: 'text-overlay',
        entityId: overlay.id,
        property: 'fontSize',
        transform: 'direct',
      }],
    })
  }

  // Shapes
  const shapes = useShapeStore.getState().shapes
  for (const shape of shapes) {
    const prefix = `shape_${shape.id.slice(0, 6)}`
    results.push({
      variable: makeVar(`${prefix}_fill`, `${shape.type} fill`, 'color', shape.fill, 'Colors'),
      bindings: [{
        variableKey: `${prefix}_fill`,
        mode: 'store-action',
        targetStore: 'shape',
        entityId: shape.id,
        property: 'fill',
        transform: 'direct',
      }],
    })
    if (shape.stroke && shape.strokeWidth > 0) {
      results.push({
        variable: makeVar(`${prefix}_stroke`, `${shape.type} stroke`, 'color', shape.stroke, 'Colors'),
        bindings: [{
          variableKey: `${prefix}_stroke`,
          mode: 'store-action',
          targetStore: 'shape',
          entityId: shape.id,
          property: 'stroke',
          transform: 'direct',
        }],
      })
    }
  }

  // HTML templates
  const templates = useHTMLTemplateLayerStore.getState().templates
  for (const tmpl of templates) {
    if (!tmpl.customConfig) continue
    const prefix = `tmpl_${tmpl.id.slice(0, 6)}`
    for (const prop of tmpl.customConfig) {
      const inferredType = inferTypeFromValue(prop.value)
      results.push({
        variable: makeVar(
          `${prefix}_${prop.key}`,
          `${tmpl.name}: ${prop.key}`,
          inferredType,
          prop.value,
          'Templates',
          undefined,
          ['template', tmpl.name],
        ),
        bindings: [{
          variableKey: `${prefix}_${prop.key}`,
          mode: 'store-action',
          targetStore: 'html-template',
          entityId: tmpl.id,
          property: prop.key,
          transform: 'direct',
        }],
      })
    }
  }

  // Characters
  const characters = useMultiCharacterStore.getState().characters
  for (const char of characters) {
    const prefix = `char_${char.id.slice(0, 6)}`
    results.push({
      variable: makeVar(`${prefix}_name`, `${char.name} name`, 'text', char.name, 'Characters'),
      bindings: [{
        variableKey: `${prefix}_name`,
        mode: 'store-action',
        targetStore: 'multi-character',
        entityId: char.id,
        property: 'name',
        transform: 'direct',
      }],
    })
    if (char.voiceId) {
      results.push({
        variable: makeVar(`${prefix}_voice`, `${char.name} voice`, 'voice', char.voiceId, 'Audio'),
        bindings: [{
          variableKey: `${prefix}_voice`,
          mode: 'store-action',
          targetStore: 'multi-character',
          entityId: char.id,
          property: 'voiceId',
          transform: 'direct',
        }],
      })
    }
  }

  // Dialogue lines
  const dialogueLines = useMultiCharacterStore.getState().dialogueLines
  for (const line of dialogueLines) {
    const char = characters.find((c) => c.id === line.characterId)
    const charName = char?.name || 'Unknown'
    const prefix = `line_${line.id.slice(0, 6)}`
    results.push({
      variable: makeVar(
        `${prefix}_script`,
        `${charName} line ${line.order + 1}`,
        'text-multiline',
        line.script,
        'Text',
        `Dialogue script for ${charName}`,
        ['dialogue', 'script'],
      ),
      bindings: [{
        variableKey: `${prefix}_script`,
        mode: 'store-action',
        targetStore: 'multi-character',
        action: 'updateDialogueLine',
        entityId: line.id,
        property: 'script',
        transform: 'direct',
      }],
    })
  }

  // Canvas dimensions
  const canvasState = useCanvasStore.getState()
  results.push({
    variable: makeVar('canvas_width', 'Canvas width', 'number', canvasState.canvasWidth, 'Layout', undefined, ['canvas']),
    bindings: [{
      variableKey: 'canvas_width',
      mode: 'store-action',
      targetStore: 'canvas',
      property: 'canvasWidth',
      transform: 'direct',
    }],
  })
  results.push({
    variable: makeVar('canvas_height', 'Canvas height', 'number', canvasState.canvasHeight, 'Layout', undefined, ['canvas']),
    bindings: [{
      variableKey: 'canvas_height',
      mode: 'store-action',
      targetStore: 'canvas',
      property: 'canvasHeight',
      transform: 'direct',
    }],
  })

  // Voice caption settings
  const voiceState = useVoiceStore.getState()
  results.push({
    variable: makeVar('caption_color', 'Caption color', 'color', voiceState.captionColor, 'Colors', undefined, ['caption']),
    bindings: [{
      variableKey: 'caption_color',
      mode: 'store-action',
      targetStore: 'voice',
      property: 'captionColor',
      transform: 'direct',
    }],
  })
  results.push({
    variable: makeVar('caption_fontSize', 'Caption font size', 'number', voiceState.captionFontSize, 'Text', undefined, ['caption']),
    bindings: [{
      variableKey: 'caption_fontSize',
      mode: 'store-action',
      targetStore: 'voice',
      property: 'captionFontSize',
      transform: 'direct',
    }],
  })

  // Timeline
  const timelineState = useTimelineStore.getState()
  results.push({
    variable: makeVar('timeline_fps', 'FPS', 'number', timelineState.fps, 'Layout', undefined, ['timeline']),
    bindings: [{
      variableKey: 'timeline_fps',
      mode: 'store-action',
      targetStore: 'timeline',
      property: 'fps',
      transform: 'direct',
    }],
  })

  return results
}

function inferTypeFromValue(value: unknown): SchemaVariable['type'] {
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'string') {
    return isColorValue(value) ? 'color' : 'text'
  }
  return 'text'
}
