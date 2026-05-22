import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBPMCounterConfig {
  bpmValue: number
  songTitle: string
  genre: string
  key: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneBPMCounterComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneBPMCounterConfig>) {
  const { bpmValue, songTitle, genre, key: musicalKey, bgColor, cardColor, accentColor, textColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const cardScale = easeOutBack(Math.min(1, enterProgress / 0.5))
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // BPM counter animation
  const bpmReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.5)))
  const displayBPM = Math.round(bpmValue * bpmReveal)

  // Pulse animation tied to BPM
  const beatInterval = 60 / bpmValue
  const beatPhase = (time % beatInterval) / beatInterval
  const beatPulse = Math.pow(1 - beatPhase, 3) * 0.15

  // Metronome pendulum
  const pendulumAngle = Math.sin(time * Math.PI * bpmValue / 60) * 30

  // Info stagger
  const titleOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))
  const infoOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.15

  // Ring segments animated
  const ringSegments = 16
  const activeSegment = Math.floor((time * bpmValue / 60) % ringSegments)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${accentColor}${Math.round(beatPulse * 200).toString(16).padStart(2, '0')} 0%, transparent 50%)` }} />

      <div style={{
        width: 'clamp(280px, 65vw, 420px)',
        background: cardColor,
        borderRadius: 'clamp(16px, 3vw, 24px)',
        padding: 'clamp(24px, 5vw, 40px)',
        transform: `scale(${cardScale * exitScale})`,
        opacity: cardOpacity * exitOpacity,
        boxShadow: `0 16px 50px rgba(0,0,0,0.4)`,
        textAlign: 'center',
      }}>
        {/* BPM label */}
        <div style={{ fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 600, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: 'clamp(16px, 3vw, 28px)', opacity: titleOp }}>
          TEMPO
        </div>

        {/* Circular BPM display */}
        <div style={{ position: 'relative', width: 'clamp(140px, 30vw, 200px)', height: 'clamp(140px, 30vw, 200px)', margin: '0 auto', marginBottom: 'clamp(16px, 3vw, 28px)' }}>
          {/* Ring segments */}
          {Array.from({ length: ringSegments }).map((_, i) => {
            const angle = (i / ringSegments) * 360 - 90
            const isActive = i === activeSegment
            const segOp = isActive ? 1 : 0.15
            return (
              <div key={i} style={{
                position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%',
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: '50%', width: 'clamp(3px, 0.6vw, 5px)', height: 'clamp(8px, 1.5vw, 12px)',
                  background: isActive ? accentColor : `${textColor}30`,
                  borderRadius: 2, transform: 'translateX(-50%)',
                  boxShadow: isActive ? `0 0 8px ${accentColor}60` : undefined,
                  opacity: segOp,
                }} />
              </div>
            )
          })}

          {/* Center BPM number */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${1 + beatPulse})`,
          }}>
            <div style={{
              fontSize: 'clamp(40px, 9vw, 64px)', fontWeight: 900, color: textColor,
              fontFamily: "'Courier New', monospace", lineHeight: 1,
            }}>
              {displayBPM}
            </div>
            <div style={{ fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 600, color: `${textColor}60`, marginTop: 2 }}>
              BPM
            </div>
          </div>
        </div>

        {/* Song title */}
        <div style={{ fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 700, color: textColor, marginBottom: 4, opacity: titleOp }}>
          {songTitle}
        </div>

        {/* Info chips */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(6px, 1.2vw, 10px)', marginTop: 'clamp(10px, 2vw, 16px)', opacity: infoOp }}>
          <div style={{
            background: `${accentColor}20`, borderRadius: 'clamp(6px, 1.2vw, 10px)',
            padding: 'clamp(4px, 0.8vw, 6px) clamp(10px, 2vw, 16px)',
            fontSize: 'clamp(10px, 1.8vw, 13px)', fontWeight: 600, color: accentColor,
          }}>
            {genre}
          </div>
          <div style={{
            background: `${textColor}10`, borderRadius: 'clamp(6px, 1.2vw, 10px)',
            padding: 'clamp(4px, 0.8vw, 6px) clamp(10px, 2vw, 16px)',
            fontSize: 'clamp(10px, 1.8vw, 13px)', fontWeight: 600, color: `${textColor}80`,
          }}>
            Key: {musicalKey}
          </div>
        </div>

        {/* Beat indicator dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(8px, 1.5vw, 14px)', marginTop: 'clamp(14px, 3vw, 24px)', opacity: infoOp }}>
          {[0, 1, 2, 3].map((i) => {
            const beatActive = Math.floor((time * bpmValue / 60) % 4) === i
            return (
              <div key={i} style={{
                width: 'clamp(8px, 1.5vw, 12px)', height: 'clamp(8px, 1.5vw, 12px)',
                borderRadius: '50%',
                background: beatActive ? accentColor : `${textColor}20`,
                boxShadow: beatActive ? `0 0 10px ${accentColor}60` : undefined,
                transform: `scale(${beatActive ? 1.2 : 1})`,
              }} />
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-bpm-counter',
  title: 'Scene BPM Counter',
  description: 'BPM/tempo counter display with pulsing ring segments, beat indicator dots, genre chip, and key info. Music production aesthetic.',
  tags: ['scene', 'music', 'bpm', 'tempo', 'counter', 'beat', 'production', 'festival'],
  category: 'scene-layout',
  component: SceneBPMCounterComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    bpmValue: 128,
    songTitle: 'Midnight Drive',
    genre: 'House',
    key: 'Am',
    bgColor: '#0A0A0A',
    cardColor: '#161620',
    accentColor: '#FF6B6B',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'bpmValue', label: 'BPM', type: 'number', defaultValue: 128, min: 40, max: 220, group: 'Content' },
    { key: 'songTitle', label: 'Song Title', type: 'text', defaultValue: 'Midnight Drive', group: 'Content' },
    { key: 'genre', label: 'Genre', type: 'text', defaultValue: 'House', group: 'Content' },
    { key: 'key', label: 'Key', type: 'text', defaultValue: 'Am', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#161620', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#FF6B6B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
