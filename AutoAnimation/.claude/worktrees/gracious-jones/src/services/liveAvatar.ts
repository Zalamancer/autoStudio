/**
 * Live Avatar Service — real-time conversational AI avatar
 * using ElevenLabs Conversational AI WebSocket API.
 *
 * Flow: Microphone → PCM chunks → WebSocket → ElevenLabs ConvAI
 *       ← Audio chunks + alignment → viseme mapping → character render
 */

import { mapPhonemeToViseme } from './lipSync'
import type { Viseme } from '@/types/voice'

// ── Types ────────────────────────────────────────────────────────────

export type LiveAvatarStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'agent-speaking'
  | 'error'

export interface LiveAvatarConfig {
  /** ElevenLabs agent ID (configured in ElevenLabs dashboard) */
  agentId: string
  /** Override voice ID (optional — agent has a default voice) */
  voiceId?: string
  /** First message the agent says on connect */
  firstMessage?: string
  /** System prompt override */
  systemPrompt?: string
  /** Audio output sample rate */
  outputSampleRate?: number
}

export interface ConversationTurn {
  role: 'user' | 'agent'
  text: string
  timestamp: number
}

export interface LiveVisemeEvent {
  viseme: Viseme
  timestamp: number
}

export type LiveAvatarEventMap = {
  'status-change': LiveAvatarStatus
  'agent-audio': { audioData: Float32Array; sampleRate: number }
  'agent-text': string
  'user-transcript': string
  'viseme': LiveVisemeEvent
  'turn': ConversationTurn
  'error': string
}

type EventHandler<K extends keyof LiveAvatarEventMap> = (data: LiveAvatarEventMap[K]) => void

// ── Constants ────────────────────────────────────────────────────────

const CONVAI_WS_URL = 'wss://api.elevenlabs.io/v1/convai/conversation'
const INPUT_SAMPLE_RATE = 16000
const OUTPUT_SAMPLE_RATE = 24000
const CHUNK_SIZE = 4096 // PCM samples per chunk

// ── Live Avatar Session ──────────────────────────────────────────────

export class LiveAvatarSession {
  private ws: WebSocket | null = null
  private mediaStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private workletNode: AudioWorkletNode | ScriptProcessorNode | null = null
  private playbackContext: AudioContext | null = null
  private status: LiveAvatarStatus = 'disconnected'
  private conversationId: string | null = null
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  private listeners = new Map<string, Set<Function>>()

  constructor(private config: LiveAvatarConfig) {}

  // ── Event emitter ─────────────────────────────────────────────────

  on<K extends keyof LiveAvatarEventMap>(event: K, handler: EventHandler<K>): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(handler)
  }

  off<K extends keyof LiveAvatarEventMap>(event: K, handler: EventHandler<K>): void {
    this.listeners.get(event)?.delete(handler)
  }

  private emit<K extends keyof LiveAvatarEventMap>(event: K, data: LiveAvatarEventMap[K]): void {
    this.listeners.get(event)?.forEach((fn) => (fn as EventHandler<K>)(data))
  }

  private setStatus(status: LiveAvatarStatus): void {
    this.status = status
    this.emit('status-change', status)
  }

  getStatus(): LiveAvatarStatus {
    return this.status
  }

  getConversationId(): string | null {
    return this.conversationId
  }

  // ── Connect ───────────────────────────────────────────────────────

  async connect(): Promise<void> {
    if (this.status !== 'disconnected' && this.status !== 'error') return

    this.setStatus('connecting')

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: INPUT_SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Set up audio capture context
      this.audioContext = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE })
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)

      // Use ScriptProcessor as fallback (AudioWorklet requires HTTPS + module)
      const processor = this.audioContext.createScriptProcessor(CHUNK_SIZE, 1, 1)
      processor.onaudioprocess = (e) => {
        if (this.status === 'connected' || this.status === 'listening') {
          const inputData = e.inputBuffer.getChannelData(0)
          this.sendAudioChunk(inputData)
        }
      }
      source.connect(processor)
      processor.connect(this.audioContext.destination)
      this.workletNode = processor

      // Set up playback context for agent audio
      this.playbackContext = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE })

      // Open WebSocket — try signed URL from server first (keeps API key secret),
      // fall back to direct connection with agent_id
      const wsUrl = await this.getWebSocketUrl()
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.sendInitiation()
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data)
      }

      this.ws.onerror = () => {
        this.emit('error', 'WebSocket connection error')
        this.setStatus('error')
      }

      this.ws.onclose = (event) => {
        if (this.status !== 'disconnected') {
          if (event.code !== 1000) {
            this.emit('error', `Connection closed: ${event.reason || 'Unknown reason'}`)
          }
          this.cleanup()
          this.setStatus('disconnected')
        }
      }
    } catch (err) {
      this.cleanup()
      const msg = err instanceof Error ? err.message : 'Failed to connect'
      this.emit('error', msg)
      this.setStatus('error')
    }
  }

  // ── Get WebSocket URL ──────────────────────────────────────────────

  private async getWebSocketUrl(): Promise<string> {
    try {
      const resp = await fetch('/api/proxy/elevenlabs-convai/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: this.config.agentId }),
      })
      if (resp.ok) {
        const data = await resp.json()
        if (data.signed_url) return data.signed_url
      }
    } catch {
      // Server proxy not available — fall back to direct connection
    }
    return `${CONVAI_WS_URL}?agent_id=${encodeURIComponent(this.config.agentId)}`
  }

  // ── Send initiation ───────────────────────────────────────────────

  private sendInitiation(): void {
    if (!this.ws) return

    const initMessage: Record<string, unknown> = {
      type: 'conversation_initiation_client_data',
      conversation_config_override: {
        agent: {
          ...(this.config.firstMessage !== undefined && {
            first_message: this.config.firstMessage,
          }),
          ...(this.config.systemPrompt && {
            prompt: { prompt: this.config.systemPrompt },
          }),
        },
        tts: {
          ...(this.config.voiceId && { voice_id: this.config.voiceId }),
        },
      },
    }

    this.ws.send(JSON.stringify(initMessage))
  }

  // ── Handle incoming messages ──────────────────────────────────────

  private handleMessage(raw: string): void {
    try {
      const msg = JSON.parse(raw)

      switch (msg.type) {
        case 'conversation_initiation_metadata':
          this.conversationId = msg.conversation_id || null
          this.setStatus('connected')
          break

        case 'audio': {
          // Base64-encoded PCM audio from agent
          const audioBase64 = msg.audio_event?.audio_base64 || msg.audio?.chunk
          if (audioBase64) {
            this.playAgentAudio(audioBase64)
          }
          this.setStatus('agent-speaking')
          break
        }

        case 'audio_alignment': {
          // Character-level timing for lip sync
          const alignment = msg.alignment || msg.audio_alignment
          if (alignment?.phonemes) {
            this.processAlignmentForVisemes(alignment)
          }
          break
        }

        case 'agent_response':
        case 'agent_chat_response_part': {
          const text = msg.agent_response?.text || msg.text || ''
          if (text) {
            this.emit('agent-text', text)
            if (msg.type === 'agent_response') {
              this.emit('turn', {
                role: 'agent',
                text,
                timestamp: Date.now(),
              })
            }
          }
          break
        }

        case 'user_transcript': {
          const text = msg.user_transcript?.text || msg.user_transcription || ''
          if (text) {
            this.emit('user-transcript', text)
            this.emit('turn', {
              role: 'user',
              text,
              timestamp: Date.now(),
            })
          }
          this.setStatus('listening')
          break
        }

        case 'tentative_user_transcript':
          // Interim transcription — ignore for now
          break

        case 'ping':
          // Respond with pong to keep alive
          this.ws?.send(JSON.stringify({ type: 'pong', event_id: msg.ping_event?.event_id }))
          break

        case 'vad_score':
          // Voice activity detection — could visualize mic level
          break

        case 'error':
          this.emit('error', msg.message || 'Server error')
          break

        default:
          // Unknown message type — ignore
          break
      }
    } catch {
      // Non-JSON message — ignore
    }
  }

  // ── Audio input (mic → WebSocket) ─────────────────────────────────

  private sendAudioChunk(float32Data: Float32Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    // Convert Float32 (-1..1) to Int16 PCM
    const pcm16 = new Int16Array(float32Data.length)
    for (let i = 0; i < float32Data.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Data[i]))
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }

    // Base64 encode
    const bytes = new Uint8Array(pcm16.buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    // Send as user_audio_chunk (no type field for performance per protocol)
    this.ws.send(JSON.stringify({ user_audio_chunk: base64 }))
  }

  // ── Audio output (WebSocket → speakers) ───────────────────────────

  private playAgentAudio(audioBase64: string): void {
    if (!this.playbackContext) return

    try {
      // Decode base64 to PCM bytes
      const binary = atob(audioBase64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }

      // Convert Int16 PCM to Float32
      const int16 = new Int16Array(bytes.buffer)
      const float32 = new Float32Array(int16.length)
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 0x8000
      }

      // Create AudioBuffer and play
      const sampleRate = this.config.outputSampleRate ?? OUTPUT_SAMPLE_RATE
      const audioBuffer = this.playbackContext.createBuffer(1, float32.length, sampleRate)
      audioBuffer.getChannelData(0).set(float32)

      const source = this.playbackContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.playbackContext.destination)
      source.start()

      // Emit audio data for visualization
      this.emit('agent-audio', { audioData: float32, sampleRate })
    } catch {
      // Audio decode error — skip chunk
    }
  }

  // ── Viseme processing from alignment ──────────────────────────────

  private processAlignmentForVisemes(alignment: {
    phonemes?: string[]
    phoneme_start_times_seconds?: number[]
    phoneme_end_times_seconds?: number[]
  }): void {
    const { phonemes, phoneme_start_times_seconds } = alignment
    if (!phonemes || !phoneme_start_times_seconds) return

    const now = Date.now()

    for (let i = 0; i < phonemes.length; i++) {
      const phoneme = phonemes[i]
      const offsetMs = (phoneme_start_times_seconds[i] ?? 0) * 1000

      const viseme = mapPhonemeToViseme(phoneme)
      this.emit('viseme', {
        viseme,
        timestamp: now + offsetMs,
      })
    }
  }

  // ── Mute / unmute microphone ──────────────────────────────────────

  setMicMuted(muted: boolean): void {
    if (this.mediaStream) {
      for (const track of this.mediaStream.getAudioTracks()) {
        track.enabled = !muted
      }
    }
  }

  // ── Send text message (instead of voice) ──────────────────────────

  sendTextMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify({
      type: 'user_message',
      text,
    }))
    this.emit('turn', { role: 'user', text, timestamp: Date.now() })
  }

  // ── Disconnect ────────────────────────────────────────────────────

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected')
    }
    this.cleanup()
    this.setStatus('disconnected')
  }

  private cleanup(): void {
    // Stop microphone
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop())
      this.mediaStream = null
    }

    // Close audio contexts
    if (this.workletNode) {
      this.workletNode.disconnect()
      this.workletNode = null
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }
    if (this.playbackContext) {
      this.playbackContext.close().catch(() => {})
      this.playbackContext = null
    }

    this.ws = null
    this.conversationId = null
  }
}

// ── Factory ──────────────────────────────────────────────────────────

let activeSession: LiveAvatarSession | null = null

export function createLiveAvatarSession(config: LiveAvatarConfig): LiveAvatarSession {
  // Disconnect any existing session
  if (activeSession) {
    activeSession.disconnect()
  }
  activeSession = new LiveAvatarSession(config)
  return activeSession
}

export function getActiveLiveAvatarSession(): LiveAvatarSession | null {
  return activeSession
}
