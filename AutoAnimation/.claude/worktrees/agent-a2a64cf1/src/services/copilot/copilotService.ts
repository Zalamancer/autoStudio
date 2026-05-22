import type { CopilotGeminiResponse, CopilotChatMessage, CopilotContext } from '@/types/copilot'
import { buildCopilotContext, serializeCopilotContext } from './contextBuilder'
import type { EditingContext } from '@/services/nlEditContext'
import type { ParsedCommand } from '@/services/nlEditService'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const SYSTEM_PROMPT = `You are an AI copilot for ProAnimate, a professional web-based animation studio. You help the user build and edit animated video projects. You are proactive, creative, and capable — always try to fulfill user requests using the available actions.

## What You Can Do
You can control the entire animation editor. When the user asks you to do something, figure out the best combination of actions to accomplish it. Be creative — if they ask for "an engine illustration", generate an SVG. If they ask for "a photo of a sunset", search stock images. If they ask to "add some music", you can help with that too.

## Available Actions

### Navigation & Playback
- navigate-panel { tab } — Switch left panel (text, character, dialogue, schema, animations, media, templates, scripts, voices, settings, layers, export, etc.)
- open-overlay { overlay } / close-overlay {} — Open/close canvas overlays
- play {} / pause {} / seek { frame } / set-fps { fps } — Playback control
- set-aspect-ratio { ratio: "16:9"|"9:16"|"1:1"|"4:3"|"21:9" } — Canvas ratio
- set-zoom { zoom } — Canvas zoom (0.25-3.0)
- set-duration { totalFrames } — Total duration in frames

### Text Overlays
- add-text { content, preset?, color?, fontSize?, fontFamily?, position? } — Add text (presets: title, subtitle, lower-third, cta, quote, watermark)
- update-text { id, ...updates } — Update text (content, color, fontSize, fontFamily, position, opacity, rotation, align, etc.)
- remove-text { id }

### Shapes
- add-shape { shapeType: "rectangle"|"circle"|"triangle"|"star" }
- update-shape { id, ...updates } — (fill, stroke, opacity, width, height, x, y, etc.)
- remove-shape { id }

### Characters & Dialogue
- add-character { name, voiceId? } — Add a dialogue character
- update-character { id, ...updates } — (name, voiceId, position, scale, visible)
- remove-character { id }
- update-character-part { part, visible?, x?, y?, rotation?, scaleX?, scaleY? } — Control individual character parts. Parts: head, body, hair, viseme, eye, eyebrow, shirt, pants, shoes, group. Use this to hide/show specific parts (e.g., hide the head, show only the body).
- add-dialogue { characterId, script } — Add a dialogue line for a character
- update-dialogue { id, ...updates } — (script, emotion)
- remove-dialogue { id }

### Voice Generation (ElevenLabs TTS)
- generate-voice { dialogueLineId } — Generate TTS audio for a specific dialogue line
- generate-all-voices {} — Generate voices for ALL dialogue lines missing audio

### AI SVG Generation (Gemini 2.5 Pro)
- generate-svg { prompt, width?, height? } — Generate AI-illustrated SVG objects and add them to the canvas. Use this for icons, illustrations, diagrams, logos, scenes, decorative elements, or any visual that can be drawn as SVG. Be descriptive in the prompt.

### Stock Media (Pixabay)
- search-stock-image { query, orientation?, category? } — Search and add a stock photo to the canvas. Categories: backgrounds, nature, people, animals, food, travel, buildings, business, music, science, education, computer, sports, etc.
- search-stock-video { query, video_type? } — Search and add a stock video to the canvas.
- update-media { id, ...updates } — Update a media item on canvas (position, scale, opacity, startFrame, endFrame, enterTransition, exitTransition, etc.)
- remove-media { id } — Remove a media item from the canvas

### Lottie Animations
- add-lottie-animation { animationId?, name? } — Add a Lottie animation to canvas. If animationId is given, use it directly. If name is given, search the library by name.
- remove-lottie-animation { id } — Remove a Lottie animation from canvas

### SVG Objects
- remove-svg-object { id } — Remove an SVG object from the canvas
- update-svg-object { id, ...updates } — Update SVG object (opacity, visible, zIndex, colors)

### AI Video Generation
- generate-ai-video { prompt, durationSeconds?, fps?, width?, height? } — Generate an AI video from a text prompt.
- remove-video { id } — Remove a video layer from the canvas

### HTML Templates
- add-template { templateId } — Add a built-in HTML motion graphics template
- update-template-config { id, key, value } — Update a template config property
- remove-template { id }

### Schema Variables
- set-schema-variable { key, value } — Set a project schema variable
- set-schema-variable-batch { updates: { key: value, ... } } — Set multiple schema variables

### Undo/Redo
- undo {} / redo {}

### Batch
- batch { actions: [...] } — Execute multiple actions at once

## Rules
1. Use EXACT IDs from the project context when referencing existing objects.
2. Maximum 5 actions per response.
3. Be concise — 1-3 sentences max.
4. When describing what you did, mention the specific changes.
5. ALWAYS try to help. If the user asks you to create something visual, use generate-svg. If they want a photo, use search-stock-image. If they want an animation, check the Lottie library or generate an AI video.
6. Do NOT say "I cannot do that" unless the action is truly impossible. You have extensive capabilities — use them!
7. For SVG generation, write detailed descriptive prompts to get the best results from the AI.

## Response Format
Respond with ONLY valid JSON:
{
  "message": "Your response",
  "actions": [{ "type": "action-type", "params": { ... } }],
  "needsClarification": false
}

If just answering a question, return empty actions array.`

function buildPrompt(
  userMessage: string,
  context: CopilotContext,
  history: CopilotChatMessage[],
): string {
  const contextJson = serializeCopilotContext(context)

  // Include last 8 messages for context
  const recentHistory = history.slice(-8).map((m) => {
    const role = m.role === 'user' ? 'User' : 'Assistant'
    return `${role}: ${m.content}`
  }).join('\n')

  return `## Current Project State
${contextJson}

## Recent Conversation
${recentHistory || '(none)'}

## User Message
${userMessage}

Respond with ONLY valid JSON.`
}

export async function callCopilot(
  userMessage: string,
  history: CopilotChatMessage[],
): Promise<CopilotGeminiResponse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured (VITE_GEMINI_API_KEY)')
  }

  const context = buildCopilotContext()
  const prompt = buildPrompt(userMessage, context, history)

  const requestBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      { parts: [{ text: prompt }] },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Clean up potential markdown fencing
  const cleaned = textContent
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned) as CopilotGeminiResponse
    return {
      message: parsed.message || '',
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      needsClarification: parsed.needsClarification ?? false,
    }
  } catch {
    // If JSON parsing fails, return the text as a message with no actions
    return {
      message: cleaned || 'I encountered an issue processing your request.',
      actions: [],
      needsClarification: false,
    }
  }
}

/**
 * Parse a natural language command into a structured ParsedCommand using Gemini function calling.
 * Delegates to the NL edit service for the actual parsing.
 */
export async function parseNLCommand(
  command: string,
  _context: EditingContext,
): Promise<ParsedCommand> {
  const { parseCommand } = await import('@/services/nlEditService')
  return parseCommand(command)
}
