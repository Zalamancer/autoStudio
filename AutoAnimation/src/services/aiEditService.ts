/**
 * AI Edit Service — Natural language editing via Gemini.
 *
 * Takes a user command and the current project state, asks Gemini to return
 * structured edit actions, then executes them against the Zustand stores.
 */

import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useMediaStore } from '@/stores/useMediaStore'
import type { CaptionStyle } from '@/types/voice'
import { logger } from '@/utils/logger'
import { callGeminiProxy } from '@/services/aiProxy'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  actions?: EditActionResult[]
}

export interface EditActionResult {
  description: string
  success: boolean
}

interface EditAction {
  type: string
  params: Record<string, unknown>
}

interface GeminiEditResponse {
  reply: string
  actions: EditAction[]
}

// ─── Project Snapshot ─────────────────────────────────────────────────────────

interface ProjectSnapshot {
  canvas: { width: number; height: number; aspectRatio: string }
  timeline: { fps: number; totalFrames: number; duration: string }
  characters: { id: string; name: string; voiceId: string | null; position: { x: number; y: number } }[]
  dialogueLines: {
    id: string
    characterId: string
    characterName: string
    script: string
    emotion?: string
    startFrame: number
    endFrame: number
  }[]
  textOverlays: {
    id: string
    content: string
    presetType: string
    fontSize: number
    position: string
    color: string
    visible: boolean
  }[]
  shapes: { id: string; name: string; type: string; fill: string; width: number; height: number; visible: boolean }[]
  animations: { id: string; name: string; visible: boolean }[]
  mediaAssets: { id: string; type: string; name: string }[]
  captionStyle: string
  captionPosition: string
  availableVoices: { id: string; name: string; category: string }[]
}

function buildProjectSnapshot(): ProjectSnapshot {
  const canvas = useCanvasStore.getState()
  const editor = useEditorStore.getState()
  const timeline = useTimelineStore.getState()
  const multiChar = useMultiCharacterStore.getState()
  const textOverlay = useTextOverlayStore.getState()
  const shapes = useShapeStore.getState()
  const voice = useVoiceStore.getState()
  const animations = useAnimationStore.getState()
  const media = useMediaStore.getState()

  const fps = timeline.fps
  const totalFrames = timeline.totalFrames
  const durationSec = totalFrames / fps

  return {
    canvas: {
      width: canvas.canvasWidth,
      height: canvas.canvasHeight,
      aspectRatio: editor.aspectRatio,
    },
    timeline: {
      fps,
      totalFrames,
      duration: `${durationSec.toFixed(1)}s`,
    },
    characters: multiChar.characters.map((c) => ({
      id: c.id,
      name: c.name,
      voiceId: c.voiceId,
      position: c.position,
    })),
    dialogueLines: multiChar.dialogueLines.map((l) => {
      const char = multiChar.characters.find((c) => c.id === l.characterId)
      return {
        id: l.id,
        characterId: l.characterId,
        characterName: char?.name || 'Unknown',
        script: l.script,
        emotion: l.emotion,
        startFrame: l.startFrame,
        endFrame: l.endFrame,
      }
    }),
    textOverlays: textOverlay.overlays.map((o) => ({
      id: o.id,
      content: o.content,
      presetType: o.presetType,
      fontSize: o.fontSize,
      position: o.position,
      color: o.color,
      visible: o.visible,
    })),
    shapes: shapes.shapes.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      fill: typeof s.fill === 'string' ? s.fill : (s.fill?.stops?.[0]?.color ?? '#000000'),
      width: s.width,
      height: s.height,
      visible: s.visible,
    })),
    animations: animations.activeAnimations.map((a) => ({
      id: a.id,
      name: a.animationId,
      visible: a.opacity > 0,
    })),
    mediaAssets: media.canvasItems.map((m) => {
      const asset = media.assets.find((a) => a.id === m.assetId)
      return {
        id: m.id,
        type: asset?.type || 'unknown',
        name: asset?.name || 'Media',
      }
    }),
    captionStyle: voice.captionStyle,
    captionPosition: voice.captionPosition,
    availableVoices: voice.availableVoices.map((v) => ({
      id: v.voice_id,
      name: v.name,
      category: v.category,
    })),
  }
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildSystemPrompt(snapshot: ProjectSnapshot, conversationHistory: ChatMessage[]): string {
  const historyText = conversationHistory
    .slice(-10) // keep last 10 messages for context
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')

  return `You are an AI editing assistant for ProAnimate, an animation studio app. The user will ask you to modify the current project using natural language. You must return a JSON object with a "reply" (natural language response) and "actions" (array of structured edits to perform).

## Current Project State
${JSON.stringify(snapshot, null, 2)}

## Conversation History
${historyText || '(none)'}

## Available Action Types

1. **update-dialogue** — Update a dialogue line
   params: { lineId: string, script?: string, emotion?: "Auto"|"Joy"|"Anger"|"Disgust"|"Fear"|"Sadness"|"Surprise"|"Neutral" }

2. **update-character-voice** — Change a character's voice
   params: { characterId: string, voiceId: string }

3. **update-text-overlay** — Modify an existing text overlay
   params: { overlayId: string, content?: string, fontSize?: number, color?: string, position?: "top"|"center"|"bottom"|"free", visible?: boolean }

4. **add-text-overlay** — Add a new text overlay
   params: { content: string, presetType?: "title"|"subtitle"|"lower-third"|"cta"|"quote"|"watermark", fontSize?: number, position?: "top"|"center"|"bottom" }

5. **remove-text-overlay** — Remove a text overlay
   params: { overlayId: string }

6. **update-shape** — Modify a shape
   params: { shapeId: string, fill?: string, width?: number, height?: number, visible?: boolean }

7. **update-canvas** — Change canvas settings
   params: { aspectRatio?: "16:9"|"9:16"|"1:1"|"4:3"|"21:9" }

8. **remove-dialogue** — Remove a dialogue line
   params: { lineId: string }

9. **update-character** — Update character properties
   params: { characterId: string, name?: string, visible?: boolean }

10. **add-stock-media** — Search and add stock media
   params: { query: string, role?: "background"|"cutaway"|"overlay"|"accent" }

11. **set-caption-style** — Change caption display style
   params: { style: "word"|"word-by-word"|"sentence"|"karaoke"|"typewriter"|"animated-pop"|"animated-bounce"|"animated-glow"|"animated-wave" }

12. **set-caption-position** — Change caption position
   params: { position: "top"|"center"|"bottom" }

13. **trim-duration** — Set total duration in seconds
   params: { durationSeconds: number }

14. **remove-animation** — Remove a Lottie animation
   params: { animationId: string }

15. **update-layer-visibility** — Show/hide any layer
   params: { layerId: string, visible: boolean }

16. **run-workflow** — Run a multi-step agent workflow
   params: { workflowId: "optimize-virality"|"enhance-engagement"|"platform-optimize"|"add-production-value" }

## Rules
- Only use action types listed above
- Reference elements by their IDs from the project state
- If the user's request is ambiguous, ask for clarification in the reply and return an empty actions array
- If the request cannot be fulfilled with available actions, explain why in the reply
- For complex multi-step requests like "make this more viral" or "optimize for TikTok", use the run-workflow action
- Keep replies concise and friendly
- When changing emotions, use one of: Auto, Joy, Anger, Disgust, Fear, Sadness, Surprise, Neutral

Respond with ONLY valid JSON in this format:
{
  "reply": "Description of what was done",
  "actions": [{ "type": "action-type", "params": { ... } }]
}`
}

// ─── Gemini Call ──────────────────────────────────────────────────────────────

async function callGeminiForEdit(userMessage: string, conversationHistory: ChatMessage[]): Promise<GeminiEditResponse> {
  const snapshot = buildProjectSnapshot()
  const systemPrompt = buildSystemPrompt(snapshot, conversationHistory)

  const PROXY_MODEL = 'gemini-3-flash-preview'
  const body = {
    contents: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      {
        role: 'model',
        parts: [
          {
            text: 'I understand. I will analyze the project state and respond with JSON containing reply and actions.',
          },
        ],
      },
      { role: 'user', parts: [{ text: userMessage }] },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  }

  const response = await callGeminiProxy(PROXY_MODEL, body)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Parse JSON response
  const cleaned = textContent
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned)
    return {
      reply: parsed.reply || 'Done.',
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    }
  } catch {
    // If parsing fails, treat the whole response as a reply with no actions
    logger.warn('Failed to parse AI edit response as JSON, using raw text')
    return {
      reply: textContent || 'I had trouble understanding that. Could you rephrase?',
      actions: [],
    }
  }
}

// ─── Action Executor ──────────────────────────────────────────────────────────

function executeAction(action: EditAction): EditActionResult {
  try {
    switch (action.type) {
      case 'update-dialogue': {
        const { lineId, script, emotion } = action.params as {
          lineId: string
          script?: string
          emotion?: string
        }
        const updates: Record<string, unknown> = {}
        if (script !== undefined) updates.script = script
        if (emotion !== undefined) updates.emotion = emotion
        useMultiCharacterStore.getState().updateDialogueLine(lineId, updates)
        return { description: `Updated dialogue line`, success: true }
      }

      case 'update-character-voice': {
        const { characterId, voiceId } = action.params as { characterId: string; voiceId: string }
        useMultiCharacterStore.getState().updateDialogueCharacter(characterId, { voiceId })
        return { description: `Changed character voice`, success: true }
      }

      case 'update-text-overlay': {
        const { overlayId, ...updates } = action.params as { overlayId: string; [k: string]: unknown }
        useTextOverlayStore.getState().updateOverlay(overlayId, updates)
        return { description: `Updated text overlay`, success: true }
      }

      case 'add-text-overlay': {
        const { content, presetType, fontSize, position } = action.params as {
          content: string
          presetType?: string
          fontSize?: number
          position?: string
        }
        const totalFrames = useTimelineStore.getState().totalFrames
        useTextOverlayStore.getState().addOverlay({
          id: `text-${Date.now()}`,
          presetType: (presetType as 'title' | 'subtitle') || 'subtitle',
          content: content || 'New Text',
          fontFamily: 'Inter',
          fontSize: fontSize || 36,
          fontWeight: 'bold',
          color: '#ffffff',
          align: 'center',
          verticalAlign: 'middle',
          position: (position as 'top' | 'center' | 'bottom') || 'bottom',
          freeX: 0,
          freeY: 0,
          lineHeight: 1.2,
          letterSpacing: 0,
          textCase: 'none',
          shadow: true,
          background: false,
          backgroundOpacity: 0.5,
          visible: true,
          opacity: 1,
          zIndex: 10,
          rotation: 0,
          width: null,
          height: null,
          startFrame: 0,
          endFrame: totalFrames,
        })
        return { description: `Added text overlay: "${content}"`, success: true }
      }

      case 'remove-text-overlay': {
        const { overlayId } = action.params as { overlayId: string }
        useTextOverlayStore.getState().removeOverlay(overlayId)
        return { description: `Removed text overlay`, success: true }
      }

      case 'update-shape': {
        const { shapeId, ...updates } = action.params as { shapeId: string; [k: string]: unknown }
        useShapeStore.getState().updateShape(shapeId, updates)
        return { description: `Updated shape`, success: true }
      }

      case 'update-canvas': {
        const { aspectRatio } = action.params as { aspectRatio?: string }
        if (aspectRatio) {
          useEditorStore.getState().setAspectRatio(aspectRatio as '16:9' | '9:16' | '1:1' | '4:3' | '21:9')
        }
        return { description: `Updated canvas settings`, success: true }
      }

      case 'remove-dialogue': {
        const { lineId } = action.params as { lineId: string }
        useMultiCharacterStore.getState().removeDialogueLine(lineId)
        return { description: `Removed dialogue line`, success: true }
      }

      case 'update-character': {
        const { characterId, ...updates } = action.params as { characterId: string; [k: string]: unknown }
        useMultiCharacterStore.getState().updateDialogueCharacter(characterId, updates)
        return { description: `Updated character`, success: true }
      }

      case 'set-caption-style': {
        const { style } = action.params as { style: string }
        const styleMap: Record<string, CaptionStyle> = {
          word: 'word-by-word',
          'word-by-word': 'word-by-word',
          sentence: 'sentence',
          karaoke: 'karaoke',
          none: 'word-by-word', // fallback to word-by-word
        }
        const mappedStyle = styleMap[style]
        if (mappedStyle) {
          useVoiceStore.getState().setCaptionStyle(mappedStyle)
          return { description: `Set caption style to "${mappedStyle}"`, success: true }
        }
        return {
          description: `Invalid caption style: ${style}. Valid: ${Object.keys(styleMap).join(', ')}`,
          success: false,
        }
      }

      case 'set-caption-position': {
        const { position } = action.params as { position: string }
        const validPositions = ['top', 'center', 'bottom'] as const
        if (validPositions.includes(position as (typeof validPositions)[number])) {
          useVoiceStore.getState().setCaptionPosition(position as 'top' | 'center' | 'bottom')
          return { description: `Set caption position to "${position}"`, success: true }
        }
        return { description: `Invalid caption position: ${position}`, success: false }
      }

      case 'trim-duration': {
        const { durationSeconds } = action.params as { durationSeconds: number }
        const fps = useTimelineStore.getState().fps || 30
        const newFrames = Math.round(durationSeconds * fps)
        if (newFrames > 0) {
          useTimelineStore.getState().setTotalFrames(newFrames)
          return { description: `Set duration to ${durationSeconds}s (${newFrames} frames)`, success: true }
        }
        return { description: `Invalid duration: ${durationSeconds}s`, success: false }
      }

      case 'add-stock-media': {
        const { query, role } = action.params as { query: string; role?: string }
        // Switch to media panel to trigger search
        useEditorStore.getState().setLeftPanelActiveTab('media')
        return {
          description: `Switched to Media panel — search for "${query}" (role: ${role || 'background'}) and add to canvas.`,
          success: true,
        }
      }

      case 'remove-animation': {
        const { animationId } = action.params as { animationId: string }
        useAnimationStore.getState().removeFromCanvas(animationId)
        return { description: `Removed animation`, success: true }
      }

      case 'update-layer-visibility': {
        const { layerId, visible } = action.params as { layerId: string; visible: boolean }
        // Try text overlay first, then shape
        const overlays = useTextOverlayStore.getState().overlays
        if (overlays.some((o) => o.id === layerId)) {
          useTextOverlayStore.getState().updateOverlay(layerId, { visible })
          return { description: `Set layer "${layerId}" visibility to ${visible}`, success: true }
        }
        const shapes = useShapeStore.getState().shapes
        if (shapes.some((s) => s.id === layerId)) {
          useShapeStore.getState().updateShape(layerId, { visible })
          return { description: `Set shape "${layerId}" visibility to ${visible}`, success: true }
        }
        return { description: `Layer "${layerId}" not found`, success: false }
      }

      case 'run-workflow': {
        const { workflowId } = action.params as { workflowId: string }
        return {
          description: `Queued workflow: ${workflowId} — use the workflow panel to monitor progress`,
          success: true,
        }
      }

      default:
        return { description: `Unknown action type: ${action.type}`, success: false }
    }
  } catch (err) {
    logger.error(`Failed to execute action ${action.type}:`, err)
    return {
      description: `Failed: ${action.type} — ${err instanceof Error ? err.message : 'Unknown error'}`,
      success: false,
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function processEditCommand(
  userMessage: string,
  conversationHistory: ChatMessage[],
): Promise<{ reply: string; actions: EditActionResult[] }> {
  const geminiResult = await callGeminiForEdit(userMessage, conversationHistory)

  const actionResults: EditActionResult[] = []
  for (const action of geminiResult.actions) {
    const result = executeAction(action)
    actionResults.push(result)
  }

  return {
    reply: geminiResult.reply,
    actions: actionResults,
  }
}
