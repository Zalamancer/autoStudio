/**
 * NL Edit Service — Natural language editing service core.
 *
 * Uses Gemini with function-calling mode to parse natural language commands
 * into structured timeline operations.
 */

import { NL_EDIT_FUNCTIONS } from '@/services/nlEditFunctions'
import { buildEditingContext, type EditingContext } from '@/services/nlEditContext'
import { logger } from '@/utils/logger'
import type { AspectRatio } from '@/types/editor'

export interface ParsedAction {
  functionName: string
  args: Record<string, unknown>
}

export interface ParsedCommand {
  actions: ParsedAction[]
  confidence: number
  explanation: string
}

const PROXY_URL = '/api/proxy/gemini/gemini-2.0-flash'
const DIRECT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

/**
 * Parse a natural language command into structured actions via Gemini function calling.
 */
export async function parseCommand(text: string, context?: EditingContext): Promise<ParsedCommand> {
  const editContext = context ?? buildEditingContext()
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''

  const systemPrompt = `You are a video editing assistant. Use the provided functions to fulfill the user's editing request. The current project state is:
- Duration: ${editContext.duration.toFixed(1)}s (${editContext.totalFrames} frames at ${editContext.fps}fps)
- Current frame: ${editContext.currentFrame}
- Characters: ${editContext.characters.map((c) => `${c.name} (${c.lineCount} lines)`).join(', ') || 'none'}
- Text overlays: ${editContext.textOverlays.map((o) => `"${o.content}" (${o.type})`).join(', ') || 'none'}
- Media items: ${editContext.mediaItems.length} items
${editContext.transcript ? `- Transcript: ${editContext.transcript.slice(0, 50).map((w) => `${w.word}@${w.startFrame}`).join(' ')}...` : ''}`

  // Build function declarations in Gemini format
  const tools = [{
    functionDeclarations: NL_EDIT_FUNCTIONS.map((fn) => ({
      name: fn.name,
      description: fn.description,
      parameters: fn.parameters,
    })),
  }]

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text }] }],
    tools,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  }

  let response: Response
  try {
    response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (response.status === 503) throw new Error('proxy unavailable')
  } catch {
    if (!apiKey) throw new Error('Gemini API key not configured')
    response = await fetch(`${DIRECT_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  if (!response.ok) throw new Error(`Gemini error: ${response.statusText}`)

  const data = await response.json()
  const candidate = data.candidates?.[0]
  const parts = candidate?.content?.parts || []

  const actions: ParsedAction[] = []
  let explanation = ''

  for (const part of parts) {
    if (part.functionCall) {
      actions.push({
        functionName: part.functionCall.name,
        args: part.functionCall.args || {},
      })
    }
    if (part.text) {
      explanation += part.text
    }
  }

  // If no function calls, try to extract from text response
  if (actions.length === 0 && explanation) {
    logger.warn('[NLEdit] No function calls returned, falling back to text:', explanation)
  }

  return {
    actions,
    confidence: actions.length > 0 ? 0.85 : 0.3,
    explanation: explanation || actions.map((a) => `${a.functionName}(${JSON.stringify(a.args)})`).join(', '),
  }
}

/**
 * Execute a parsed command by mapping function calls to store actions.
 */
export async function executeCommand(parsed: ParsedCommand): Promise<void> {
  const { useTimelineStore } = await import('@/stores/useTimelineStore')
  const { useTextOverlayStore } = await import('@/stores/useTextOverlayStore')
  const { useEditorStore } = await import('@/stores/useEditorStore')

  for (const action of parsed.actions) {
    switch (action.functionName) {
      case 'set_duration': {
        const fps = useTimelineStore.getState().fps || 30
        const frames = Math.round((action.args.durationSeconds as number) * fps)
        useTimelineStore.getState().setTotalFrames(frames)
        break
      }
      case 'seek_to_frame': {
        useTimelineStore.getState().seekToFrame(action.args.frame as number)
        break
      }
      case 'seek_to_time': {
        const fps = useTimelineStore.getState().fps || 30
        useTimelineStore.getState().seekToFrame(Math.round((action.args.timeSec as number) * fps))
        break
      }
      case 'add_text_overlay': {
        const { useTextOverlayStore: store } = await import('@/stores/useTextOverlayStore')
        store.getState().addOverlay({
          id: `text-${Date.now()}`,
          presetType: (action.args.presetType as string) ?? 'title',
          content: (action.args.content as string) ?? 'Text',
          fontFamily: 'Inter',
          fontSize: (action.args.fontSize as number) ?? 48,
          fontWeight: 'bold',
          color: (action.args.color as string) ?? '#ffffff',
          align: 'center',
          verticalAlign: 'center',
          position: (action.args.position as string) ?? 'center',
          freeX: 50,
          freeY: 50,
          lineHeight: 1.2,
          letterSpacing: 0,
          textCase: 'none',
          visible: true,
          opacity: 1,
          startFrame: 0,
          endFrame: useTimelineStore.getState().totalFrames,
          bgColor: 'transparent',
          bgOpacity: 0,
          shadow: false,
          outline: false,
          outlineColor: '#000000',
          outlineWidth: 2,
          animation: 'none',
        } as never)
        break
      }
      case 'remove_text_overlay': {
        useTextOverlayStore.getState().removeOverlay(action.args.overlayId as string)
        break
      }
      case 'play': {
        useTimelineStore.getState().play()
        break
      }
      case 'pause': {
        useTimelineStore.getState().pause()
        break
      }
      case 'set_aspect_ratio': {
        useEditorStore.getState().setAspectRatio(action.args.ratio as AspectRatio)
        break
      }
      default: {
        logger.warn(`[NLEdit] Unhandled function: ${action.functionName}`)
      }
    }
  }
}
